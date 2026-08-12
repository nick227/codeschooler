import { describe, expect, it } from 'vitest'
import { AssistantService } from './AssistantService'
import { ContentService } from './ContentService'

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
