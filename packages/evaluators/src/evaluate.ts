import type { ChallengeCheck } from '@code-trainer/content-schema'
import type { ExecutionResult } from '@code-trainer/language-javascript'

export interface CheckOutcome {
  check: ChallengeCheck
  passed: boolean
  /** Short present-tense label for the HUD checklist, e.g. "Created score". */
  label: string
}

type CheckEvaluator = (check: ChallengeCheck, result: ExecutionResult) => CheckOutcome

function callExpression(name: string, args: unknown[]): string {
  return `${name}(${args.map((argument) => JSON.stringify(argument)).join(', ')})`
}

const evaluatorRegistry = {
  variableExists: ((check, result) => {
    if (check.type !== 'variableExists') return incompatibleCheck(check)
    const probe = result.probes[`typeof ${check.name}`]
    return { check, passed: Boolean(probe?.ok && probe.value !== 'undefined'), label: `Created ${check.name}` }
  }) satisfies CheckEvaluator,

  variableEquals: ((check, result) => {
    if (check.type !== 'variableEquals') return incompatibleCheck(check)
    const typeProbe = result.probes[`typeof ${check.name}`]
    const valueProbe = result.probes[check.name]
    const passed = Boolean(
      typeProbe?.ok && typeProbe.value !== 'undefined' && valueProbe?.ok && deepEqual(valueProbe.value, check.value),
    )
    return { check, passed, label: `${check.name} has the right value` }
  }) satisfies CheckEvaluator,

  outputEquals: ((check, result) => {
    if (check.type !== 'outputEquals') return incompatibleCheck(check)
    const actual = result.logs.join('\n').trim()
    return { check, passed: actual === check.value.trim(), label: 'Prints the expected output' }
  }) satisfies CheckEvaluator,

  outputContains: ((check, result) => {
    if (check.type !== 'outputContains') return incompatibleCheck(check)
    const actual = result.logs.join('\n')
    return { check, passed: actual.includes(check.value), label: `Output includes "${check.value}"` }
  }) satisfies CheckEvaluator,

  functionExists: ((check, result) => {
    if (check.type !== 'functionExists') return incompatibleCheck(check)
    const probe = result.probes[`typeof ${check.name}`]
    return { check, passed: probe?.ok === true && probe.value === 'function', label: `Defined ${check.name}` }
  }) satisfies CheckEvaluator,

  functionReturns: ((check, result) => {
    if (check.type !== 'functionReturns') return incompatibleCheck(check)
    const typeProbe = result.probes[`typeof ${check.name}`]
    const callProbe = result.probes[callExpression(check.name, check.args ?? [])]
    const passed = Boolean(
      typeProbe?.ok && typeProbe.value === 'function' && callProbe?.ok && deepEqual(callProbe.value, check.value),
    )
    return { check, passed, label: `${check.name}(...) returns the right value` }
  }) satisfies CheckEvaluator,

  arrayEquals: ((check, result) => {
    if (check.type !== 'arrayEquals') return incompatibleCheck(check)
    const valueProbe = result.probes[check.name]
    const passed = Boolean(valueProbe?.ok && Array.isArray(valueProbe.value) && deepEqual(valueProbe.value, check.value))
    return { check, passed, label: `${check.name} matches expected array` }
  }) satisfies CheckEvaluator,

  objectEquals: ((check, result) => {
    if (check.type !== 'objectEquals') return incompatibleCheck(check)
    const valueProbe = result.probes[check.name]
    const isObject = valueProbe?.ok && typeof valueProbe.value === 'object' && valueProbe.value !== null && !Array.isArray(valueProbe.value)
    const passed = Boolean(isObject && deepEqual(valueProbe.value, check.value))
    return { check, passed, label: `${check.name} matches expected object` }
  }) satisfies CheckEvaluator,
} satisfies Record<ChallengeCheck['type'], CheckEvaluator>

/** The declared-check registry is the sole correctness authority. */
export function evaluateChecks(checks: ChallengeCheck[], result: ExecutionResult): CheckOutcome[] {
  return checks.map((check) => evaluatorRegistry[check.type](check, result))
}

export function isComplete(outcomes: CheckOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((outcome) => outcome.passed)
}

function incompatibleCheck(check: ChallengeCheck): never {
  throw new Error(`Evaluator received an incompatible check: ${JSON.stringify(check)}`)
}

function deepEqual(left: unknown, right: unknown, seen = new WeakMap<object, object>()): boolean {
  if (Object.is(left, right)) return true
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false
  if (Array.isArray(left) !== Array.isArray(right)) return false

  const previous = seen.get(left)
  if (previous) return previous === right
  seen.set(left, right)

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index], seen))
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord).sort()
  const rightKeys = Object.keys(rightRecord).sort()
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && deepEqual(leftRecord[key], rightRecord[key], seen))
  )
}
