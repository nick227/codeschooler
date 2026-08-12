import { getQuickJS } from 'quickjs-emscripten'
import { buildProgram, type ExecutionResult } from '@code-trainer/language-javascript'
import { evaluateChecks, isComplete, probesForChecks } from '@code-trainer/evaluators'
import type { Challenge } from '@code-trainer/content-schema'

const TIMEOUT_MS = 1_000
const MEMORY_BYTES = 16 * 1024 * 1024
const STACK_BYTES = 512 * 1024
const OUTPUT_BYTES = 32 * 1024

/**
 * Server correctness authority. A fresh QuickJS WASM isolate receives only
 * ECMAScript intrinsics: no Node process, filesystem, network, storage, or
 * application credentials are installed in its global object.
 */
export class AuthoritativeEvaluationService {
  async check(source: string, challenge: Challenge, lastSuccessfulRunSource?: string) {
    if (Buffer.byteLength(source, 'utf8') > 100_000) {
      throw { statusCode: 413, message: 'Source exceeds the 100 KB evaluation limit' }
    }

    const QuickJS = await getQuickJS()
    const runtime = QuickJS.newRuntime()
    runtime.setMemoryLimit(MEMORY_BYTES)
    runtime.setMaxStackSize(STACK_BYTES)
    const deadline = Date.now() + TIMEOUT_MS
    runtime.setInterruptHandler(() => Date.now() >= deadline)
    const context = runtime.newContext()

    try {
      const program = buildProgram(source, probesForChecks(challenge.checks), {
        maxOutputBytes: OUTPUT_BYTES,
      })
      const evaluated = context.evalCode(`(function () { ${program}\n})()`)
      if (evaluated.error) {
        const error = context.dump(evaluated.error) as { message?: string }
        evaluated.error.dispose()
        const timedOut = Date.now() >= deadline
        return this.resultForFailure(timedOut ? 'Execution timed out' : String(error?.message ?? error), timedOut)
      }

      const dumped = context.dump(evaluated.value) as {
        logs?: string[]
        probes?: ExecutionResult['probes']
        outputTruncated?: boolean
        runtimeError?: string
      }
      evaluated.value.dispose()
      const execution: ExecutionResult = {
        success: dumped.runtimeError === undefined,
        logs: dumped.logs ?? [],
        probes: dumped.probes ?? {},
        durationMs: Math.min(TIMEOUT_MS, Math.max(0, TIMEOUT_MS - (deadline - Date.now()))),
        outputTruncated: dumped.outputTruncated ?? false,
        ...(dumped.runtimeError ? { error: { message: dumped.runtimeError, raw: dumped.runtimeError } } : {}),
      }
      const outcomes = execution.success ? evaluateChecks(challenge.checks, execution) : []
      const checksPassed = isComplete(outcomes)
      const runRequired = challenge.requiresRun && lastSuccessfulRunSource !== source
      return { execution, outcomes, checksPassed, complete: checksPassed && !runRequired, runRequired }
    } finally {
      context.dispose()
      runtime.dispose()
    }
  }

  private resultForFailure(message: string, timedOut: boolean) {
    return {
      execution: {
        success: false,
        error: { message, raw: message },
        logs: [],
        probes: {},
        durationMs: TIMEOUT_MS,
        ...(timedOut ? { timedOut: true } : {}),
      } satisfies ExecutionResult,
      outcomes: [],
      checksPassed: false,
      complete: false,
      runRequired: false,
    }
  }
}
