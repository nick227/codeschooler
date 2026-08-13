import { describe, expect, it } from 'vitest'
import { AssistantService } from './AssistantService'
import { ContentService } from './ContentService'
import { evidenceKindForChallenge, scoreForEvidence } from './ProgressService'

describe('public curriculum projection', () => {
  it('does not expose authored hints or solution fixtures', () => {
    const challenge = new ContentService().getChallenge('js-create-variable-004') as Record<
      string,
      unknown
    >

    expect(challenge).not.toHaveProperty('hints')
    expect(challenge).not.toHaveProperty('authoring')
    expect(challenge).toMatchObject({ revision: 1, requiresRun: false })
  })

  it('never exposes quiz answers or explanations', () => {
    const quiz = new ContentService().getQuizSet('variables-concept-check') as {
      questions: Array<Record<string, unknown>>
    }
    expect(quiz.questions).toHaveLength(2)
    for (const question of quiz.questions) expect(question).not.toHaveProperty('answer')
  })
})

describe('learning evidence policy', () => {
  it('derives evidence kind from canonical content, not a client claim', () => {
    expect(evidenceKindForChallenge('variables-transfer', 'independent')).toBe('TRANSFER')
    expect(evidenceKindForChallenge('variables-concept-check', 'independent')).toBe('CONCEPT_CHECK')
    expect(evidenceKindForChallenge('lesson-step', 'guided')).toBe('PRACTICE')
  })

  it('caps practice below stronger transfer and concept evidence', () => {
    expect(scoreForEvidence('PRACTICE', 'INDEPENDENT_SUCCESS')).toBeLessThan(
      scoreForEvidence('TRANSFER', 'INDEPENDENT_SUCCESS'),
    )
    expect(scoreForEvidence('TRANSFER', 'INDEPENDENT_SUCCESS')).toBeLessThan(
      scoreForEvidence('CONCEPT_CHECK', 'INDEPENDENT_SUCCESS'),
    )
  })
})

describe('deterministic hint ladder', () => {
  const assistant = new AssistantService()

  it('advances one reviewed hint at a time and stops before reveal', () => {
    expect(assistant.getHint({ challengeId: 'js-create-variable-004', previousHintLevel: 0 })).toMatchObject({
      level: 1,
    })
    expect(assistant.getHint({ challengeId: 'js-create-variable-004', previousHintLevel: 3 })).toMatchObject({
      level: 3,
    })
  })

  it('reveals level four only when explicitly requested', () => {
    const hint = assistant.getHint({
      challengeId: 'js-create-variable-004',
      previousHintLevel: 1,
      userRequestedReveal: true,
    })
    expect(hint).toEqual({ level: 4, message: 'const score = 10' })
  })
})
