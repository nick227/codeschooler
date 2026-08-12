import type { Challenge } from '@code-trainer/content-schema'
import type { ExecutionResult } from '@code-trainer/language-javascript'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn<(source: string, probes?: string[]) => Promise<ExecutionResult>>(),
}))

vi.mock('@code-trainer/language-javascript', async (importOriginal) => {
  const original = await importOriginal<typeof import('@code-trainer/language-javascript')>()
  return { ...original, execute: executeMock }
})

import { checkChallenge, runProgram } from '../run'

const challenge = {
  checks: [{ type: 'outputEquals', value: 'Hello' }],
  requiresRun: true,
} as Challenge

describe('Run and Check contracts', () => {
  beforeEach(() => {
    executeMock.mockReset()
    executeMock.mockResolvedValue({ success: true, logs: ['Hello'], probes: {}, durationMs: 1 })
  })

  it('Run executes without grading probes', async () => {
    await runProgram('console.log("Hello")')
    expect(executeMock).toHaveBeenCalledWith('console.log("Hello")', [], {})
  })

  it('Check withholds completion until the exact current source has run', async () => {
    const source = 'console.log("Hello")'
    const beforeRun = await checkChallenge(source, challenge)
    const afterRun = await checkChallenge(source, challenge, { lastSuccessfulRunSource: source })
    const afterEdit = await checkChallenge(`${source};`, challenge, { lastSuccessfulRunSource: source })

    expect(beforeRun).toMatchObject({ checksPassed: true, complete: false, runRequired: true })
    expect(afterRun).toMatchObject({ checksPassed: true, complete: true, runRequired: false })
    expect(afterEdit).toMatchObject({ checksPassed: true, complete: false, runRequired: true })
  })
})
