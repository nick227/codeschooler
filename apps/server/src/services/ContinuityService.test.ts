import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
  mergeReceipt: { findUnique: vi.fn() },
}))
vi.mock('@code-trainer/db', () => ({ db: dbMock }))

import { ContinuityService, strongestByChallenge } from './ContinuityService'

describe('anonymous merge idempotency', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a prior receipt without re-verifying source or granting a reward twice', async () => {
    dbMock.mergeReceipt.findUnique.mockResolvedValue({
      result: { alreadyMerged: false, draftsMerged: 1, evidenceMerged: 1, telemetryMerged: 0, rewardsGranted: 25 },
    })
    const submitAttempt = vi.fn()
    const service = new ContinuityService({ submitAttempt } as never)
    const result = await service.merge('user-1', {
      idempotencyKey: 'merge-key-123',
      drafts: [], evidence: [], telemetry: [],
    })
    expect(result).toEqual({ alreadyMerged: true, draftsMerged: 1, evidenceMerged: 1, telemetryMerged: 0, rewardsGranted: 25 })
    expect(submitAttempt).not.toHaveBeenCalled()
  })
})

describe('evidence strength', () => {
  it('selects independent success regardless of import ordering', () => {
    const common = { challengeId: 'transfer-1', occurredAt: '2026-01-01T00:00:00.000Z' }
    const strongest = strongestByChallenge([
      { ...common, result: 'HINTED_SUCCESS' as const, hintsUsed: 2 },
      { ...common, result: 'FAILED' as const, hintsUsed: 0 },
      { ...common, result: 'INDEPENDENT_SUCCESS' as const, hintsUsed: 0 },
    ])
    expect(strongest).toEqual([{ ...common, result: 'INDEPENDENT_SUCCESS', hintsUsed: 0 }])
  })
})
