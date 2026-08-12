import type { Diagnostic } from '@code-trainer/language-javascript'
import type { CheckOutcome } from '@code-trainer/evaluators'
import type { PublicChallenge, TeachingResponse } from './workspace.types'

function expectedName(challenge: PublicChallenge): string | undefined {
  return challenge.checks.find((check) => check.type === 'variableExists')?.name
}

function expectedValue(challenge: PublicChallenge): unknown {
  return challenge.checks.find((check) => check.type === 'variableEquals')?.value
}

export function responseForDiagnostic(source: string, diagnostic: Diagnostic): TeachingResponse {
  const trimmed = source.trim()
  if (/^(const|let|var)$/.test(trimmed)) {
    return { key: 'declaration.missing-name', kind: 'diagnostic', message: 'You started a declaration. It still needs a name and a value.' }
  }
  if (/^(const|let|var)\s+[A-Za-z_$][\w$]*\s*=$/.test(trimmed)) {
    return { key: 'assignment.missing-value', kind: 'diagnostic', message: 'This declaration needs a value after the equals sign.' }
  }
  return { key: `syntax:${diagnostic.raw}`, kind: 'diagnostic', message: diagnostic.message }
}

export function responseForOutcomes(
  source: string,
  challenge: PublicChallenge,
  outcomes: CheckOutcome[],
  hasFreshRun: boolean,
): TeachingResponse | undefined {
  if (!source.trim()) return undefined
  const allPassed = outcomes.length > 0 && outcomes.every((outcome) => outcome.passed)
  if (allPassed) {
    if (!requiresRun(challenge)) {
      return { key: 'ready.check', kind: 'ready', message: 'The pieces are in place. Check your work when you’re ready.' }
    }
    return hasFreshRun
      ? { key: 'ready.check', kind: 'ready', message: 'Your program ran with the result the goal asks for. Check it when you’re ready.' }
      : { key: 'ready.run', kind: 'ready', message: 'The pieces are in place. Run the program to see what the computer holds.' }
  }

  const name = expectedName(challenge)
  const value = expectedValue(challenge)
  const existsOutcome = outcomes.find((outcome) => outcome.check.type === 'variableExists')
  const valueOutcome = outcomes.find((outcome) => outcome.check.type === 'variableEquals')

  if (name && existsOutcome && !existsOutcome.passed) {
    const declaration = source.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/)
    if (declaration?.[1] && declaration[1] !== name) {
      return { key: 'variable.wrong-name', kind: 'diagnostic', message: `You created ${declaration[1]}. This goal asks for the name ${name}.` }
    }
  }
  if (name && existsOutcome?.passed && valueOutcome && !valueOutcome.passed) {
    const quotedExpected = typeof value === 'number' && new RegExp(`\\b${name}\\s*=\\s*['"]${String(value)}['"]`).test(source)
    return quotedExpected
      ? { key: 'value.string-instead-of-number', kind: 'diagnostic', message: `${name} currently holds text. The goal asks for the number ${String(value)}.` }
      : { key: 'value.wrong', kind: 'acknowledgement', message: `You created ${name}. Now give it the value ${String(value)}.` }
  }
  return undefined
}

export function requiresRun(challenge: PublicChallenge): boolean {
  if (challenge.requiresRun !== undefined) return challenge.requiresRun
  return challenge.checks.some((check) => ['variableExists', 'variableEquals', 'outputEquals', 'outputContains', 'functionReturns'].includes(check.type))
}
