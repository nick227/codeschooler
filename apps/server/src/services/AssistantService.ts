import { getChallenge } from '@code-trainer/learning-engine'

export interface HintRequest {
  challengeId: string
  previousHintLevel: number
  userRequestedReveal?: boolean
}

/**
 * Deterministic authored hint selection for the validation slice.
 * Correctness and learning state are established by the client-side parser,
 * runner, and evaluator. This service only advances the reviewed hint ladder.
 */
export class AssistantService {
  getHint(input: HintRequest) {
    const challenge = getChallenge(input.challengeId)
    if (!challenge) throw { statusCode: 404, message: 'Challenge not found' }

    const requestedLevel = input.userRequestedReveal
      ? 4
      : Math.min(3, Math.max(1, input.previousHintLevel + 1))
    const hint = challenge.hints.find((candidate) => candidate.level === requestedLevel)

    if (!hint) throw { statusCode: 422, message: 'No authored hint is available for this step' }

    return { level: hint.level, message: hint.message }
  }
}
