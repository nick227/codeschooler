import type { ChallengeCheck } from '@code-trainer/content-schema'

function callExpression(name: string, args: unknown[]): string {
  return `${name}(${args.map((a) => JSON.stringify(a)).join(', ')})`
}

/** The set of expressions the runner needs to evaluate to judge every check. */
export function probesForChecks(checks: ChallengeCheck[]): string[] {
  const probes = new Set<string>()

  for (const check of checks) {
    switch (check.type) {
      case 'variableExists':
        probes.add(`typeof ${check.name}`)
        break
      case 'variableEquals':
        probes.add(`typeof ${check.name}`)
        probes.add(check.name)
        break
      case 'functionExists':
        probes.add(`typeof ${check.name}`)
        break
      case 'functionReturns':
        probes.add(`typeof ${check.name}`)
        probes.add(callExpression(check.name, check.args))
        break
      case 'outputEquals':
      case 'outputContains':
        // Judged from captured console output — no probe expression needed.
        break
    }
  }

  return [...probes]
}
