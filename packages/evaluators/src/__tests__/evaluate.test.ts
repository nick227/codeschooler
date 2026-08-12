import type { ChallengeCheck } from '@code-trainer/content-schema'
import type { ExecutionResult } from '@code-trainer/language-javascript'
import { describe, expect, it } from 'vitest'
import { evaluateChecks, isComplete } from '../evaluate'

function execution(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return { success: true, logs: [], probes: {}, durationMs: 1, ...overrides }
}

describe('evaluator registry', () => {
  it('evaluates every current check type semantically', () => {
    const checks: ChallengeCheck[] = [
      { type: 'variableExists', name: 'score' },
      { type: 'variableEquals', name: 'score', value: { total: 10, label: 'ok' } },
      { type: 'outputEquals', value: 'Hello' },
      { type: 'outputContains', value: 'ell' },
      { type: 'functionExists', name: 'add' },
      { type: 'functionReturns', name: 'add', args: [2, 3], value: 5 },
    ]
    const result = execution({
      logs: ['Hello'],
      probes: {
        'typeof score': { ok: true, value: 'object' },
        score: { ok: true, value: { label: 'ok', total: 10 } },
        'typeof add': { ok: true, value: 'function' },
        'add(2, 3)': { ok: true, value: 5 },
      },
    })

    const outcomes = evaluateChecks(checks, result)
    expect(outcomes.every((outcome) => outcome.passed)).toBe(true)
    expect(isComplete(outcomes)).toBe(true)
  })

  it('does not treat a failed probe as an existing function', () => {
    const outcomes = evaluateChecks(
      [{ type: 'functionExists', name: 'add' }],
      execution({ probes: { 'typeof add': { ok: false, value: 'function' } } }),
    )
    expect(outcomes[0]?.passed).toBe(false)
  })

  it('never completes an empty evaluator set', () => {
    expect(isComplete([])).toBe(false)
  })
})
