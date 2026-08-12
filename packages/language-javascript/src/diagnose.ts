import type { Diagnostic } from './types'

// Translates raw acorn/runtime error messages into beginner-appropriate
// language while preserving the original diagnostic (docs/10-inline-assistant-contract.md).
// Bad:    SyntaxError: Unexpected string
// Better: "name" is text here. A variable name should not be in quotes.
//
// This is necessarily a heuristic pattern match over the handful of syntax
// mistakes beginner curriculum actually produces (docs/04 sections 1-3) —
// not a general syntax-error explainer. Unmatched errors fall back to a
// neutral framing that still surfaces the raw message.
export function translateDiagnostic(err: unknown, source: string): Diagnostic {
  const raw = err instanceof Error ? err.message : String(err)
  const loc = (err as { loc?: { line: number; column: number } } | undefined)?.loc
  const line = loc?.line ?? 1
  const column = (loc?.column ?? 0) + 1
  const lineText = source.split('\n')[line - 1] ?? ''

  return { message: friendlyMessage(raw, lineText), raw, line, column, severity: 'error' }
}

function friendlyMessage(raw: string, lineText: string): string {
  if (raw.includes('Unterminated string constant')) {
    return 'This text is missing a closing quote. Every " needs a matching " to end it.'
  }
  if (raw.includes('Unexpected end of input')) {
    return "This line isn't finished yet — check for a missing closing parenthesis ) or brace }."
  }
  if (raw.includes('Unexpected string')) {
    return 'Text in quotes cannot go here directly — check what comes right before it.'
  }
  if (raw.includes('Unexpected number')) {
    return 'A number cannot go here directly — check what comes right before it.'
  }
  if (raw.includes('Assigning to rvalue') || raw.includes('Invalid left-hand side')) {
    return 'The left side of = must be something that can hold a value, like a variable name.'
  }
  if (raw.includes('has already been declared')) {
    return 'This name was already used for another variable — pick a different name, or remove the duplicate.'
  }
  if (raw.includes('Unexpected token')) {
    if (/[A-Za-z]/.test(lineText)) {
      return "There's a character here the computer doesn't expect. If you meant to write text, put it in quotes."
    }
    return "There's a character here the computer doesn't expect."
  }

  return `This line has a syntax problem the computer can't run yet: ${raw}`
}
