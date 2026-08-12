import { describe, expect, it } from 'vitest'
import { observeSource } from '@code-trainer/language-javascript'
import type { CheckOutcome } from '@code-trainer/evaluators'
import { requiresRun, responseForDiagnostic, responseForOutcomes } from './teachingPolicy'
import type { PublicChallenge } from './workspace.types'

const challenge: PublicChallenge = {
  id: 'variables',
  revision: 1,
  language: 'javascript',
  title: 'Create a Score',
  instruction: 'Create a variable named score and give it the value 10.',
  starterCode: '',
  skills: ['javascript.variables'],
  guidance: 'guided',
  checks: [{ type: 'variableExists', name: 'score' }, { type: 'variableEquals', name: 'score', value: 10 }],
  reward: { xp: 20 },
  requiresRun: true,
}

function outcomes(exists: boolean, equals: boolean): CheckOutcome[] {
  return [
    { check: challenge.checks[0] as CheckOutcome['check'], passed: exists, label: 'Created score' },
    { check: challenge.checks[1] as CheckOutcome['check'], passed: equals, label: 'score has the right value' },
  ]
}

describe('variables teaching policy', () => {
  it('frames unfinished declarations as progress', () => {
    const observation = observeSource('const score =')
    expect(observation.state).toBe('incomplete')
    expect(responseForDiagnostic('const score =', observation.diagnostic!).message).toContain('needs a value')
  })

  it('explains a quoted number without revealing new syntax', () => {
    expect(responseForOutcomes('const score = "10"', challenge, outcomes(true, false), false)?.key).toBe('value.string-instead-of-number')
  })

  it('moves from Run to Check only after a fresh run', () => {
    expect(responseForOutcomes('const score = 10', challenge, outcomes(true, true), false)?.key).toBe('ready.run')
    expect(responseForOutcomes('const score = 10', challenge, outcomes(true, true), true)?.key).toBe('ready.check')
    expect(requiresRun(challenge)).toBe(true)
  })
})
