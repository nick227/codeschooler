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
      { type: 'objectEquals', name: 'score', value: { total: 10, label: 'ok' } },
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

  describe('arrayEquals and objectEquals', () => {
    it('arrayEquals exact match and ordering', () => {
      const checks: ChallengeCheck[] = [
        { type: 'arrayEquals', name: 'arr', value: [1, 2, 3] },
      ]
      const result = execution({ probes: { arr: { ok: true, value: [1, 2, 3] } } })
      const outcomes = evaluateChecks(checks, result)
      expect(outcomes[0]?.passed).toBe(true)

      // ordering matters
      const result2 = execution({ probes: { arr: { ok: true, value: [3, 2, 1] } } })
      const outcomes2 = evaluateChecks(checks, result2)
      expect(outcomes2[0]?.passed).toBe(false)
    })

    it('arrayEquals nested values and wrong length', () => {
      const checks: ChallengeCheck[] = [
        { type: 'arrayEquals', name: 'arr', value: [[1, 2], { a: 3 }] },
      ]
      const result = execution({ probes: { arr: { ok: true, value: [[1, 2], { a: 3 }] } } })
      expect(evaluateChecks(checks, result)[0]?.passed).toBe(true)

      const result2 = execution({ probes: { arr: { ok: true, value: [[1, 2]] } } })
      expect(evaluateChecks(checks, result2)[0]?.passed).toBe(false)
    })

    it('objectEquals exact match, missing key, nested and primitive mismatch', () => {
      const checks: ChallengeCheck[] = [
        { type: 'objectEquals', name: 'obj', value: { x: 1, y: { z: 2 } } },
      ]
      const result = execution({ probes: { obj: { ok: true, value: { y: { z: 2 }, x: 1 } } } })
      // key order should not matter
      expect(evaluateChecks(checks, result)[0]?.passed).toBe(true)

      const result2 = execution({ probes: { obj: { ok: true, value: { x: 1 } } } })
      expect(evaluateChecks(checks, result2)[0]?.passed).toBe(false)

      const result3 = execution({ probes: { obj: { ok: true, value: { x: 1, y: { z: 3 } } } } })
      expect(evaluateChecks(checks, result3)[0]?.passed).toBe(false)
    })
  })
})
