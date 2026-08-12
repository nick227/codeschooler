import { beforeEach, describe, expect, it } from 'vitest'
import { localTelemetryRepository } from './LocalTelemetryRepository'

describe('local telemetry queue', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

  it('stores canonical source-free learning events', () => {
    localTelemetryRepository.record({ attemptId: 'attempt-123', challengeId: 'challenge-1', challengeRevision: 1 }, {
      name: 'check_attempt', data: { attemptCount: 2, checksPassed: 1, checksTotal: 2 },
    })
    const key = [...Array(localStorage.length)].map((_, index) => localStorage.key(index)).find((item) => item?.startsWith('code-trainer:telemetry:v1:'))
    const stored = localStorage.getItem(key!)!
    expect(JSON.parse(stored)).toMatchObject({ name: 'check_attempt', challengeId: 'challenge-1', data: { attemptCount: 2 } })
    expect(stored).not.toContain('source')
  })
})
