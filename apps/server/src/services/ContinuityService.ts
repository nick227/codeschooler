import { db } from '@code-trainer/db'
import { getChallenge, getQuestionPrivate, getQuizSet } from '@code-trainer/learning-engine'
import type { EvidenceKind, EvidenceResult } from './ProgressService'
import { ProgressService } from './ProgressService'
import { parseLearningTelemetryEvent, type LearningTelemetryEvent } from '@code-trainer/telemetry-contract'

export type TelemetryInput = LearningTelemetryEvent

export interface MergeInput {
  idempotencyKey: string
  drafts: Array<{ challengeId: string; contentRevision: number; source: string; updatedAt: string }>
  evidence: Array<{
    clientEventId: string; challengeId: string; contentRevision: number
    kind: EvidenceKind; result: EvidenceResult; hintsUsed: number; attempts: number; occurredAt: string
  }>
  telemetry: TelemetryInput[]
}

export class ContinuityService {
  constructor(private readonly progress = new ProgressService()) {}
  async recordTelemetry(userId: string, events: TelemetryInput[]) {
    for (const event of events) validateTelemetry(event)
    const result = await db.telemetryEvent.createMany({
      data: events.map((event) => ({
        userId,
        clientEventId: event.eventId,
        challengeId: event.challengeId,
        name: telemetryDbName(event.name),
        occurredAt: new Date(event.occurredAt),
        metadata: event.data,
      })),
      skipDuplicates: true,
    })
    return { accepted: result.count, duplicates: events.length - result.count }
  }

  async getDraft(userId: string, challengeId: string) {
    if (!getChallenge(challengeId)) throw { statusCode: 404, message: 'Challenge not found' }
    return db.draft.findUnique({ where: { userId_challengeId: { userId, challengeId } } })
  }

  async putDraft(userId: string, challengeId: string, input: { contentRevision: number; source: string; updatedAt: string }) {
    validateContent(challengeId, input.contentRevision)
    const incoming = new Date(input.updatedAt)
    if (!Number.isFinite(incoming.getTime())) throw { statusCode: 400, message: 'Invalid updatedAt' }
    try {
      await db.draft.create({
        data: { userId, challengeId, contentRevision: input.contentRevision, source: input.source, clientUpdatedAt: incoming },
      })
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error
      // The timestamp predicate makes concurrent out-of-order PUTs safe: an
      // older edit can never overwrite a newer one between read and write.
      await db.draft.updateMany({
        where: { userId, challengeId, clientUpdatedAt: { lt: incoming } },
        data: { contentRevision: input.contentRevision, source: input.source, clientUpdatedAt: incoming },
      })
    }
    return db.draft.findUniqueOrThrow({ where: { userId_challengeId: { userId, challengeId } } })
  }

  async merge(userId: string, input: MergeInput) {
    const receipt = await db.mergeReceipt.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
    })
    if (receipt) return { ...(receipt.result as object), alreadyMerged: true }

    for (const draft of input.drafts) validateContent(draft.challengeId, draft.contentRevision)
    for (const evidence of input.evidence) validateEvidenceTarget(evidence.challengeId, evidence.contentRevision)
    for (const event of input.telemetry) validateTelemetry(event)

    const merged = await db.$transaction(async (tx) => {
      let draftsMerged = 0
      for (const draft of input.drafts) {
        const incomingDate = new Date(draft.updatedAt)
        const existing = await tx.draft.findUnique({
          where: { userId_challengeId: { userId, challengeId: draft.challengeId } },
        })
        if (!existing || incomingDate > existing.clientUpdatedAt) {
          await tx.draft.upsert({
            where: { userId_challengeId: { userId, challengeId: draft.challengeId } },
            create: {
              userId, challengeId: draft.challengeId, contentRevision: draft.contentRevision,
              source: draft.source, clientUpdatedAt: incomingDate,
            },
            update: {
              contentRevision: draft.contentRevision, source: draft.source, clientUpdatedAt: incomingDate,
            },
          })
          draftsMerged++
        }
      }

      const evidenceCreated = await tx.learningEvidence.createMany({
        data: input.evidence.map((item) => ({
          userId,
          clientEventId: item.clientEventId,
          challengeId: item.challengeId,
          contentRevision: item.contentRevision,
          kind: item.kind,
          result: item.result,
          hintsUsed: item.hintsUsed,
          attempts: item.attempts,
          occurredAt: new Date(item.occurredAt),
          verified: false,
        })),
        skipDuplicates: true,
      })
      const telemetryCreated = await tx.telemetryEvent.createMany({
        data: input.telemetry.map((event) => ({
          userId, clientEventId: event.eventId, challengeId: event.challengeId,
          name: telemetryDbName(event.name), occurredAt: new Date(event.occurredAt), metadata: event.data,
        })),
        skipDuplicates: true,
      })
      return {
        alreadyMerged: false,
        draftsMerged,
        evidenceMerged: evidenceCreated.count,
        telemetryMerged: telemetryCreated.count,
        rewardsGranted: 0,
      }
    })

    // A matching draft gives the server concrete source to verify. Claimed
    // success without source remains untrusted history and cannot mint XP.
    let rewardsGranted = 0
    // Import history append-only, but verify only the strongest claim for each
    // executable challenge. Upload ordering must never turn an independent
    // success into hinted mastery (or a later failure into a regression).
    const strongestEvidence = strongestByChallenge(input.evidence)
    for (const evidence of strongestEvidence) {
      if (evidence.result === 'FAILED') continue
      if (!getChallenge(evidence.challengeId)) continue
      const draft = input.drafts.find((item) =>
        item.challengeId === evidence.challengeId && item.contentRevision === evidence.contentRevision,
      )
      if (!draft) continue
      const verified = await this.progress.submitAttempt(userId, {
        clientAttemptId: `merge:${input.idempotencyKey}:${evidence.challengeId}`,
        challengeId: evidence.challengeId,
        source: draft.source,
        hintsUsed: evidence.hintsUsed,
        durationMs: 0,
        lastSuccessfulRunSource: draft.source,
      })
      rewardsGranted += verified.xpJustAwarded
    }
    const result = { ...merged, rewardsGranted }
    await db.mergeReceipt.upsert({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
      create: { userId, idempotencyKey: input.idempotencyKey, result },
      update: {},
    })
    return result
  }
}

function validateContent(challengeId: string, revision: number) {
  const challenge = getChallenge(challengeId)
  if (!challenge) throw { statusCode: 400, message: `Unknown challenge: ${challengeId}` }
  if (challenge.revision !== revision) throw { statusCode: 409, message: `Content revision mismatch: ${challengeId}` }
}

function validateEvidenceTarget(id: string, revision: number) {
  const authored = getChallenge(id) ?? getQuestionPrivate(id)?.question ?? getQuizSet(id)
  if (!authored) throw { statusCode: 400, message: `Unknown authored item: ${id}` }
  if (authored.revision !== revision) throw { statusCode: 409, message: `Content revision mismatch: ${id}` }
}

export function strongestByChallenge<T extends { challengeId: string; result: EvidenceResult; hintsUsed: number; occurredAt: string }>(items: T[]): T[] {
  const strength: Record<EvidenceResult, number> = { FAILED: 0, HINTED_SUCCESS: 1, INDEPENDENT_SUCCESS: 2 }
  const strongest = new Map<string, T>()
  for (const item of items) {
    const current = strongest.get(item.challengeId)
    if (!current || strength[item.result] > strength[current.result]
      || (strength[item.result] === strength[current.result] && item.hintsUsed < current.hintsUsed)
      || (strength[item.result] === strength[current.result] && item.hintsUsed === current.hintsUsed && item.occurredAt > current.occurredAt)) {
      strongest.set(item.challengeId, item)
    }
  }
  return [...strongest.values()]
}

function validateTelemetry(event: TelemetryInput) {
  try { parseLearningTelemetryEvent(event) } catch { throw { statusCode: 400, message: 'Invalid learning telemetry event' } }
  const authored = getChallenge(event.challengeId) ?? getQuestionPrivate(event.challengeId)?.question ?? getQuizSet(event.challengeId)
  if (!authored) {
    throw { statusCode: 400, message: `Unknown authored item: ${event.challengeId}` }
  }
  if (authored.revision !== event.challengeRevision) {
    throw { statusCode: 409, message: `Content revision mismatch: ${event.challengeId}` }
  }
}

function telemetryDbName(name: LearningTelemetryEvent['name']) {
  return name.toUpperCase() as Uppercase<LearningTelemetryEvent['name']>
}
