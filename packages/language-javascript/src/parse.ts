import { parse as acornParse } from 'acorn'
import type { ParseResult, SourceObservation } from './types'
import { translateDiagnostic } from './diagnose'

/**
 * Checks whether source is syntactically valid JavaScript. This is cheap
 * enough to run on every keystroke (the editor calls it to decide when to
 * show diagnostics) — it never executes user code.
 */
export function parse(source: string): ParseResult {
  try {
    acornParse(source, { ecmaVersion: 2022, sourceType: 'script' })
    return { valid: true }
  } catch (err) {
    return { valid: false, diagnostic: translateDiagnostic(err, source) }
  }
}

/**
 * Classifies editor source without treating every unfinished keystroke as a
 * mistake. Strict parsing still decides whether code is runnable; this extra
 * state lets the teaching layer recognize useful partial progress.
 */
export function observeSource(source: string): SourceObservation {
  if (source.trim().length === 0) return { state: 'empty', runnable: false }

  try {
    acornParse(source, { ecmaVersion: 2022, sourceType: 'script' })
    return { state: 'valid', runnable: true }
  } catch (err) {
    const diagnostic = translateDiagnostic(err, source)
    const incomplete = isLikelyIncomplete(err, source)
    return {
      state: incomplete ? 'incomplete' : 'invalid',
      runnable: false,
      diagnostic: incomplete
        ? { ...diagnostic, message: 'This line cannot run yet because it is not finished.' }
        : diagnostic,
    }
  }
}

function isLikelyIncomplete(err: unknown, source: string): boolean {
  const parseError = err as { message?: string; pos?: number } | undefined
  const raw = parseError?.message ?? ''
  const end = source.trimEnd().length

  // Acorn reports the declaration sequence documented in docs/09 at EOF:
  // `const`, `const score`, and `const score =` are progress, not mistakes.
  if (typeof parseError?.pos === 'number' && parseError.pos >= end) return true
  if (raw.includes('Unterminated string constant') || raw.includes('Unterminated template')) return true
  if (raw.includes('Unexpected end of input')) return true
  return false
}
