import { db } from '@code-trainer/db'
import { getChallenge } from '@code-trainer/learning-engine'
import type { EvidenceKind, EvidenceResult } from './ProgressService'

export type TelemetryName =
  | 'CHALLENGE_STARTED' | 'MEANINGFUL_PARSE_STATE' | 'REPEATED_MISCONCEPTION'
  | 'HINT_LEVEL_USED' | 'RUN' | 'CHECK_ATTEMPT' | 'COMPLETION'
  | 'TRANSFER_RESULT' | 'CONCEPT_CHECK_RESULT' | 'TIME_TO_FIRST_SUCCESS'

export interface TelemetryInput {
  clientEventId: string
  challengeId: string
  name: TelemetryName
  occurredAt: string
  metadata?: Record<string, string | number | boolean | null>
}

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
  async recordTelemetry(userId: string, events: TelemetryInput[]) {
    for (const event of events) validateTelemetry(event)
    const result = await db.telemetryEvent.createMany({
      data: events.map((event) => ({
        userId,
        clientEventId: event.clientEventId,
        challengeId: event.challengeId,
        name: event.name,
        occurredAt: new Date(event.occurredAt),
        metadata: event.metadata ?? undefined,
      })),
      skipDuplicates: true,
    })
    return { accepted: result.count, duplicates: events.length - result.count }
  }

  async merge(userId: string, input: MergeInput) {
    const receipt = await db.mergeReceipt.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
    })
    if (receipt) return { ...(receipt.result as object), alreadyMerged: true }

    for (const draft of input.drafts) validateContent(draft.challengeId, draft.contentRevision)
    for (const evidence of input.evidence) validateContent(evidence.challengeId, evidence.contentRevision)
    for (const event of input.telemetry) validateTelemetry(event)

    return db.$transaction(async (tx) => {
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
          userId, clientEventId: event.clientEventId, challengeId: event.challengeId,
          name: event.name, occurredAt: new Date(event.occurredAt), metadata: event.metadata ?? undefined,
        })),
        skipDuplicates: true,
      })
      const result = {
        alreadyMerged: false,
        draftsMerged,
        evidenceMerged: evidenceCreated.count,
        telemetryMerged: telemetryCreated.count,
        rewardsGranted: 0,
      }
      // Imported client assertions preserve continuity but are unverified and
      // never mint rewards/mastery. The next authenticated Check verifies them.
      await tx.mergeReceipt.create({ data: { userId, idempotencyKey: input.idempotencyKey, result } })
      return result
    })
  }
}

function validateContent(challengeId: string, revision: number) {
  const challenge = getChallenge(challengeId)
  if (!challenge) throw { statusCode: 400, message: `Unknown challenge: ${challengeId}` }
  if (challenge.revision !== revision) throw { statusCode: 409, message: `Content revision mismatch: ${challengeId}` }
}

function validateTelemetry(event: TelemetryInput) {
  if (!getChallenge(event.challengeId)) throw { statusCode: 400, message: `Unknown challenge: ${event.challengeId}` }
  if (!Number.isFinite(Date.parse(event.occurredAt))) throw { statusCode: 400, message: 'Invalid occurredAt' }
  const encoded = JSON.stringify(event.metadata ?? {})
  if (encoded.length > 2_048 || /source|code|snapshot/i.test(Object.keys(event.metadata ?? {}).join(','))) {
    throw { statusCode: 400, message: 'Telemetry metadata must not contain source snapshots' }
  }
}
