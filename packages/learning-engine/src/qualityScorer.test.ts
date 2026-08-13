import { describe, it } from 'node:test'
import assert from 'node:assert'
import { scoreInterviewProblem } from './qualityScorer'
import type { InterviewProblem } from '@code-trainer/content-schema'

const mockProblem: InterviewProblem = {
  id: 'test-prob-001',
  revision: 1,
  title: 'Unique Two Sum Solution',
  summary: 'Distinct test problem summary',
  difficulty: 'easy',
  pattern: 'hash-maps',
  progression: 'intro',
  challenge: {
    id: 'test-prob-001-c',
    revision: 1,
    language: 'javascript',
    title: 'Unique Two Sum Solution',
    instruction: 'Find two unique numbers in an array that add up to target.',
    starterCode: 'function twoSum() {}',
    skills: ['javascript.algorithms_hash_maps'],
    guidance: 'guided',
    checks: [{ type: 'functionExists', name: 'twoSum' }],
    hints: [
      { level: 1, message: 'Hint level 1' },
      { level: 2, message: 'Hint level 2' },
      { level: 3, message: 'Hint level 3' },
      { level: 4, message: 'return function solution()' },
    ],
    reward: { xp: 50 },
    requiresRun: false,
    runtime: {
      environment: 'worker',
      timeoutMs: 2000,
      maxOutputBytes: 16384,
      capabilities: { network: false, storage: false, timers: false, dom: false },
    },
    authoring: {
      referenceSolution: 'function twoSum(nums, target) { return [0, 1]; }',
      acceptedSolutions: [{ name: 'standard', source: 'function twoSum(nums, target) { return [0, 1]; }' }],
      rejectedSolutions: [{ name: 'returns null', source: 'function twoSum() { return null; }' }],
    },
  },
}

describe('qualityScorer module', () => {
  it('passes high-quality unique problem with score >= 70', () => {
    const result = scoreInterviewProblem(mockProblem, [])
    assert.strictEqual(result.passed, true)
    assert.ok(result.score >= 70)
    assert.strictEqual(result.issues.length, 0)
  })

  it('rejects duplicate problem with title/instruction similarity', () => {
    const duplicateCandidate: InterviewProblem = {
      ...mockProblem,
      id: 'dup-prob-002',
    }
    const result = scoreInterviewProblem(duplicateCandidate, [mockProblem])
    assert.strictEqual(result.passed, false)
    assert.ok(result.issues.some((i) => i.code === 'duplicate_similarity'))
    assert.ok(result.reviewFlags.length > 0)
  })

  it('flags incomplete hint ladders and progression mismatches', () => {
    const badProblem: InterviewProblem = {
      ...mockProblem,
      difficulty: 'hard',
      progression: 'intro', // Invalid pairing
      challenge: {
        ...mockProblem.challenge,
        hints: [{ level: 1, message: 'Only one hint' }],
      },
    }
    const result = scoreInterviewProblem(badProblem, [])
    assert.strictEqual(result.passed, false)
    assert.ok(result.issues.some((i) => i.code === 'hint_quality'))
    assert.ok(result.issues.some((i) => i.code === 'progression_mismatch'))
  })
})
