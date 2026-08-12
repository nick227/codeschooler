import { beforeEach, describe, expect, it } from 'vitest'
import { localDraftRepository } from './LocalDraftRepository'

describe('anonymous merge export', () => {
  beforeEach(() => localStorage.clear())

  it('exports drafts and evidence without accepting an XP amount as evidence', () => {
    localDraftRepository.save('challenge-1', 2, 'const answer = 42')
    localDraftRepository.recordEvidence({
      challengeId: 'challenge-1', contentRevision: 2, kind: 'TRANSFER',
      result: 'INDEPENDENT_SUCCESS', hintsUsed: 0, attempts: 1,
    })
    const payload = localDraftRepository.exportForMerge()
    expect(payload.drafts[0]?.source).toBe('const answer = 42')
    expect(payload.evidence[0]?.result).toBe('INDEPENDENT_SUCCESS')
    expect(payload.evidence[0]).not.toHaveProperty('xp')
    expect(payload.idempotencyKey.length).toBeGreaterThanOrEqual(8)
  })

  it('keeps a stable idempotency key until a successful merge clears it', () => {
    const first = localDraftRepository.exportForMerge().idempotencyKey
    expect(localDraftRepository.exportForMerge().idempotencyKey).toBe(first)
    localDraftRepository.clearMergedAnonymousData()
    expect(localDraftRepository.exportForMerge().idempotencyKey).not.toBe(first)
  })
})
