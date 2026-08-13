import { createHash } from 'node:crypto'
import { db, Prisma, type Attempt, type MasteryRecord, type Progress, type XPEvent } from '@code-trainer/db'
import { getChallenge } from '@code-trainer/learning-engine'
import { AuthoritativeEvaluationService } from './AuthoritativeEvaluationService'

const XP_PER_LEVEL = 100
const GUIDED_PRACTICE_STEP = 0.15
const GUIDED_PRACTICE_CAP = 0.6

export interface AttemptInput {
  clientAttemptId: string
  challengeId: string
  source: string
  hintsUsed: number
  durationMs: number
  lastSuccessfulRunSource?: string
}

export type EvidenceKind = 'PRACTICE' | 'TRANSFER' | 'CONCEPT_CHECK'
export type EvidenceResult = 'INDEPENDENT_SUCCESS' | 'HINTED_SUCCESS' | 'FAILED'

export class ProgressService {
  constructor(private readonly evaluator = new AuthoritativeEvaluationService()) {}

  async submitAttempt(userId: string, input: AttemptInput) {
    const challenge = getChallenge(input.challengeId)
    if (!challenge) throw { statusCode: 404, message: 'Challenge not found' }

    const duplicate = await db.attempt.findUnique({
      where: { userId_clientAttemptId: { userId, clientAttemptId: input.clientAttemptId } },
    })
    if (duplicate) return this.existingAttemptResult(userId, duplicate)

    // Client results are deliberately absent from AttemptInput. Only this
    // server-side isolate can decide passed/check counts and unlock rewards.
    const authoritative = await this.evaluator.check(input.source, challenge, input.lastSuccessfulRunSource)
    const checksTotal = challenge.checks.length
    const checksPassed = authoritative.outcomes.filter((outcome) => outcome.passed).length
    const passed = authoritative.complete
    const sourceHash = createHash('sha256').update(input.source).digest('hex')

    return db.$transaction(async (tx: Prisma.TransactionClient) => {
      const attempt = await tx.attempt.create({
        data: {
          userId,
          clientAttemptId: input.clientAttemptId,
          challengeId: input.challengeId,
          sourceHash,
          passed,
          checksTotal,
          checksPassed,
          hintsUsed: input.hintsUsed,
          durationMs: input.durationMs,
        },
      })

      const existing = await tx.progress.findUnique({
        where: { userId_challengeId: { userId, challengeId: input.challengeId } },
      })
      const attemptCount = (existing?.attemptCount ?? 0) + 1
      await tx.progress.upsert({
        where: { userId_challengeId: { userId, challengeId: input.challengeId } },
        create: { userId, challengeId: input.challengeId, attemptCount: 1, hintsUsed: input.hintsUsed },
        update: { attemptCount: { increment: 1 }, hintsUsed: Math.max(existing?.hintsUsed ?? 0, input.hintsUsed) },
      })

      const completionClaim = passed
        ? await tx.progress.updateMany({
            where: { userId, challengeId: input.challengeId, status: 'IN_PROGRESS' },
            data: { status: 'COMPLETED', completedAt: new Date() },
          })
        : { count: 0 }
      const newlyCompleted = completionClaim.count === 1
      const kind = evidenceKindForChallenge(challenge.id, challenge.guidance, challenge.evidence?.role)
      const evidenceResult: EvidenceResult = passed
        ? input.hintsUsed === 0 ? 'INDEPENDENT_SUCCESS' : 'HINTED_SUCCESS'
        : 'FAILED'
      await tx.learningEvidence.create({
        data: {
          userId,
          clientEventId: `attempt:${input.clientAttemptId}`,
          challengeId: challenge.id,
          contentRevision: challenge.revision,
          kind,
          result: evidenceResult,
          hintsUsed: input.hintsUsed,
          attempts: attemptCount,
          occurredAt: attempt.createdAt,
          verified: true,
        },
      })

      let xpJustAwarded = 0
      if (newlyCompleted) {
        const grants = [
          ['CHALLENGE_COMPLETE', challenge.reward.xp] as const,
          ['FIRST_PASS_BONUS', attemptCount === 1 ? (challenge.reward.firstPassBonusXp ?? 0) : 0] as const,
          ['LOW_HINT_BONUS', input.hintsUsed === 0 ? (challenge.reward.lowHintBonusXp ?? 0) : 0] as const,
        ]
        for (const [type, amount] of grants) {
          if (amount <= 0) continue
          await tx.xPEvent.create({ data: { userId, type, amount, challengeId: challenge.id } })
          xpJustAwarded += amount
        }

        for (const skillId of challenge.skills) {
          const current = await tx.masteryRecord.findUnique({ where: { userId_skillId: { userId, skillId } } })
          const evidenceScore = scoreForEvidence(kind, evidenceResult)
          await tx.masteryRecord.upsert({
            where: { userId_skillId: { userId, skillId } },
            create: { userId, skillId, masteryScore: evidenceScore, evidenceCount: 1 },
            update: {
              masteryScore: Math.max(current?.masteryScore ?? 0, evidenceScore),
              evidenceCount: { increment: 1 },
            },
          })
        }
      }

      if (xpJustAwarded > 0) {
        await tx.progress.update({
          where: { userId_challengeId: { userId, challengeId: challenge.id } },
          data: { xpAwarded: { increment: xpJustAwarded } },
        })
      }
      const progress = await tx.progress.findUniqueOrThrow({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
      })
      return { attempt, progress, newlyCompleted, xpJustAwarded, authoritative, duplicate: false }
    })
  }

  private async existingAttemptResult(userId: string, attempt: Attempt) {
    const progress = await db.progress.findUniqueOrThrow({
      where: { userId_challengeId: { userId, challengeId: attempt.challengeId } },
    })
    return {
      attempt,
      progress,
      newlyCompleted: false,
      xpJustAwarded: 0,
      authoritative: {
        checksPassed: attempt.checksPassed === attempt.checksTotal,
        complete: attempt.passed,
        runRequired: false,
        outcomes: [],
        execution: null,
      },
      duplicate: true,
    }
  }

  async listProgress(userId: string): Promise<Progress[]> {
    return db.progress.findMany({ where: { userId } })
  }

  async getSummary(userId: string) {
    const [xpEvents, completedChallengeCount, mastery] = await Promise.all([
      db.xPEvent.findMany({ where: { userId }, select: { amount: true } }),
      db.progress.count({ where: { userId, status: 'COMPLETED' } }),
      db.masteryRecord.findMany({ where: { userId } }),
    ])
    const totalXp = xpEvents.reduce((sum: number, event: Pick<XPEvent, 'amount'>) => sum + event.amount, 0)
    return {
      totalXp,
      level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
      completedChallengeCount,
      mastery: mastery.map(({ skillId, masteryScore, evidenceCount }: MasteryRecord) => ({
        skillId,
        masteryScore,
        evidenceCount,
      })),
    }
  }
}

export function evidenceKindForChallenge(id: string, guidance: string, evidenceRole?: string): EvidenceKind {
  if (id.includes('concept-check')) return 'CONCEPT_CHECK'
  if (evidenceRole === 'transfer' || id.includes('transfer') || guidance === 'independent') return 'TRANSFER'
  return 'PRACTICE'
}

export function scoreForEvidence(kind: EvidenceKind, result: EvidenceResult): number {
  if (result === 'FAILED') return 0
  if (kind === 'PRACTICE') return result === 'INDEPENDENT_SUCCESS' ? GUIDED_PRACTICE_CAP : GUIDED_PRACTICE_STEP
  if (kind === 'TRANSFER') return result === 'INDEPENDENT_SUCCESS' ? 0.85 : 0.7
  return result === 'INDEPENDENT_SUCCESS' ? 1 : 0.8
}
