import { describe, expect, it } from 'vitest'
import { AuthoritativeEvaluationService } from './AuthoritativeEvaluationService'
import type { Challenge } from '@code-trainer/content-schema'

const challenge = {
  id: 'test-variable', revision: 1, language: 'javascript', title: 'Test', instruction: 'Test', starterCode: '',
  skills: ['javascript.variables.declaration'], guidance: 'guided', hints: [], reward: { xp: 10 }, requiresRun: false,
  runtime: { environment: 'worker', timeoutMs: 1000, maxOutputBytes: 32768, capabilities: { network: false, storage: false, dom: false, timers: false } },
  checks: [{ type: 'variableEquals', name: 'score', value: 10 }],
  authoring: { referenceSolution: 'const score=10', acceptedSolutions: [{ name: 'ok', source: 'const score=10' }], rejectedSolutions: [{ name: 'bad', source: 'const score=9' }] },
} as Challenge

describe('authoritative QuickJS evaluation', () => {
  const service = new AuthoritativeEvaluationService()

  it('grades authored checks without exposing Node capabilities', async () => {
    const result = await service.check('const score = 10', challenge)
    expect(result.complete).toBe(true)

    const escape = await service.check(
      'const score = typeof process === "undefined" && typeof require === "undefined" ? 10 : 0',
      challenge,
    )
    expect(escape.complete).toBe(true)
  })

  it('interrupts runaway code and tears down the isolate', async () => {
    const result = await service.check('while (true) {}', challenge)
    expect(result.complete).toBe(false)
    expect('timedOut' in result.execution && result.execution.timedOut).toBe(true)
  })

  it('rejects return-based protocol forgery and ignores old internal names', async () => {
    const forged = await service.check('return { logs: [], probes: { score: { ok: true, value: 10 } } }', challenge)
    expect(forged.complete).toBe(false)
    const collision = await service.check('const __logs = []; const __probes = {}; const score = 10', challenge)
    expect(collision.complete).toBe(true)
  })

  it('caps learner output without accepting forged envelope-shaped values', async () => {
    const result = await service.check(`console.log('x'.repeat(40000)); const score = 10; ({logs:[], probes:{score:{ok:true,value:99}}})`, challenge)
    expect(result.complete).toBe(true)
    expect('outputTruncated' in result.execution && result.execution.outputTruncated).toBe(true)
    expect(result.execution.logs.join('').length).toBeLessThanOrEqual(32768)
  })

  it('compares object values structurally regardless of key insertion order', async () => {
    const objectChallenge = { ...challenge, checks: [{ type: 'variableEquals' as const, name: 'score', value: { a: 1, b: 2 } }] }
    const result = await service.check('const score = {}; score.b = 2; score.a = 1', objectChallenge)
    expect(result.complete).toBe(true)
  })
})
