import type { Progress } from '@code-trainer/db'
import { ProgressService, type AttemptInput } from '../services/ProgressService'
import { ContinuityService, type MergeInput, type TelemetryInput } from '../services/ContinuityService'

const progressService = new ProgressService()
const continuityService = new ContinuityService()

export async function submitAttempt(request: any, reply: any) {
  const result = await progressService.submitAttempt(request.user.id, request.body as AttemptInput)
  return reply.status(201).send({
    data: {
      attempt: {
        id: result.attempt.id,
        challengeId: result.attempt.challengeId,
        passed: result.attempt.passed,
        checksTotal: result.attempt.checksTotal,
        checksPassed: result.attempt.checksPassed,
        hintsUsed: result.attempt.hintsUsed,
        createdAt: result.attempt.createdAt.toISOString(),
      },
      authoritative: {
        checksPassed: result.attempt.checksPassed,
        checksTotal: result.attempt.checksTotal,
        complete: result.attempt.passed,
        runRequired: result.authoritative.runRequired,
      },
      progress: {
        challengeId: result.progress.challengeId,
        status: result.progress.status,
        attemptCount: result.progress.attemptCount,
        hintsUsed: result.progress.hintsUsed,
        xpAwarded: result.progress.xpAwarded,
        completedAt: result.progress.completedAt?.toISOString() ?? null,
      },
      newlyCompleted: result.newlyCompleted,
      xpJustAwarded: result.xpJustAwarded,
      duplicate: result.duplicate,
    },
  })
}

export async function recordTelemetry(request: any, reply: any) {
  const result = await continuityService.recordTelemetry(
    request.user.id,
    (request.body as { events: TelemetryInput[] }).events,
  )
  return reply.status(202).send({ data: result })
}

export async function mergeAnonymousProgress(request: any, reply: any) {
  const result = await continuityService.merge(request.user.id, request.body as MergeInput)
  return reply.send({ data: result })
}

function draftResponse(draft: { challengeId: string; contentRevision: number; source: string; clientUpdatedAt: Date } | null) {
  return draft && { challengeId: draft.challengeId, contentRevision: draft.contentRevision, source: draft.source, updatedAt: draft.clientUpdatedAt.toISOString() }
}

export async function getDraft(request: any, reply: any) {
  return reply.send({ data: draftResponse(await continuityService.getDraft(request.user.id, request.params.challengeId)) })
}

export async function putDraft(request: any, reply: any) {
  const draft = await continuityService.putDraft(request.user.id, request.params.challengeId, request.body)
  return reply.send({ data: draftResponse(draft) })
}

export async function listProgress(request: any, reply: any) {
  const items = await progressService.listProgress(request.user.id)
  return reply.send({
    data: items.map((progress: Progress) => ({
      challengeId: progress.challengeId,
      status: progress.status,
      attemptCount: progress.attemptCount,
      hintsUsed: progress.hintsUsed,
      xpAwarded: progress.xpAwarded,
      completedAt: progress.completedAt?.toISOString() ?? null,
    })),
  })
}

export async function getProgressSummary(request: any, reply: any) {
  return reply.send({ data: await progressService.getSummary(request.user.id) })
}
