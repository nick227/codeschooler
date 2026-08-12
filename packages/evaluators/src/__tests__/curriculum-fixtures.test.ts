import { describe, expect, it } from 'vitest'
import { listInterviewProblems, listProjects, listSectionsForTrack } from '@code-trainer/learning-engine'
import { buildProgram, type ExecutionResult } from '@code-trainer/language-javascript'
import { evaluateChecks, isComplete } from '../evaluate'
import { probesForChecks } from '../probes'

function evaluate(source: string, checks: Parameters<typeof probesForChecks>[0]) {
  const program = buildProgram(source, probesForChecks(checks))
  const run = new Function(program) as () => {
    logs: string[]
    probes: ExecutionResult['probes']
    outputTruncated: boolean
    runtimeError?: string
  }
  const raw = run()
  const execution: ExecutionResult = {
    success: raw.runtimeError === undefined,
    logs: raw.logs,
    probes: raw.probes,
    durationMs: 0,
    outputTruncated: raw.outputTruncated,
    ...(raw.runtimeError ? { error: { message: raw.runtimeError, raw: raw.runtimeError } } : {}),
  }
  return execution.success && isComplete(evaluateChecks(checks, execution))
}

describe('authored curriculum solution fixtures', () => {
  const challenges = [
    ...listSectionsForTrack('javascript-fundamentals').flatMap((section) =>
      section.lessons.flatMap((lesson) => lesson.challenges)),
    ...listProjects().flatMap((project) => project.milestones.map((milestone) => milestone.challenge)),
    ...listInterviewProblems().map((problem) => problem.challenge),
  ]

  for (const challenge of challenges) {
      it(`${challenge.id} accepts its reference and alternate solutions`, () => {
        expect(evaluate(challenge.authoring.referenceSolution, challenge.checks)).toBe(true)
        for (const fixture of challenge.authoring.acceptedSolutions) {
          expect(evaluate(fixture.source, challenge.checks), fixture.name).toBe(true)
        }
      })

      it(`${challenge.id} rejects known incorrect solutions`, () => {
        for (const fixture of challenge.authoring.rejectedSolutions) {
          expect(evaluate(fixture.source, challenge.checks), fixture.name).toBe(false)
        }
      })
  }
})
