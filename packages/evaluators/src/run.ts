import { execute, type ExecutionOptions, type ExecutionResult } from '@code-trainer/language-javascript'
import type { Challenge } from '@code-trainer/content-schema'
import { probesForChecks } from './probes'
import { evaluateChecks, isComplete, type CheckOutcome } from './evaluate'

export interface CheckContext {
  /** Exact source from the most recent successful explicit Run action. */
  lastSuccessfulRunSource?: string
  executionOptions?: ExecutionOptions
}

export interface ChallengeCheckResult {
  execution: ExecutionResult
  outcomes: CheckOutcome[]
  checksPassed: boolean
  complete: boolean
  runRequired: boolean
}

/** Ungraded experimentation. This never evaluates checks or reports completion. */
export function runProgram(source: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
  return execute(source, [], options)
}

/**
 * Explicit readiness evaluation. Completion is withheld when authored content
 * requires a successful Run of the exact current source.
 */
export async function checkChallenge(
  source: string,
  challenge: Challenge,
  context: CheckContext = {},
): Promise<ChallengeCheckResult> {
  const execution = await execute(source, probesForChecks(challenge.checks), context.executionOptions)
  const outcomes = execution.success ? evaluateChecks(challenge.checks, execution) : []
  const checksPassed = isComplete(outcomes)
  const requiresRun = (challenge as Challenge & { requiresRun?: boolean }).requiresRun === true
  const runRequired = requiresRun && context.lastSuccessfulRunSource !== source

  return { execution, outcomes, checksPassed, complete: checksPassed && !runRequired, runRequired }
}

/** @deprecated Use checkChallenge for grading or runProgram for experimentation. */
export const runChallenge = checkChallenge
export type ChallengeRunResult = ChallengeCheckResult
