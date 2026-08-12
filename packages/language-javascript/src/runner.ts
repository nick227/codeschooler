import { DEFAULT_RUNTIME_MANIFEST, type ExecutionOptions, type ExecutionResult, type RuntimeCapabilities } from './types'

const DEFAULT_TIMEOUT_MS = 3000
const MIN_TIMEOUT_MS = 100
const MAX_TIMEOUT_MS = 10_000
const DEFAULT_MAX_OUTPUT_BYTES = 64 * 1024
const MIN_OUTPUT_BYTES = 256
const MAX_OUTPUT_BYTES = 1024 * 1024

let nextRequestId = 0
const activeWorkers = new Set<Worker>()
const activeCancellations = new Set<() => void>()

export const RUNTIME_SECURITY_NOTE =
  'Pure JavaScript runs in a disposable Worker with explicit capabilities; DOM code runs in an opaque-origin, CSP-restricted iframe.'

export function normalizeCapabilities(capabilities?: Partial<RuntimeCapabilities>): RuntimeCapabilities {
  return {
    network: Array.isArray(capabilities?.network) ? capabilities.network.filter(Boolean) : false,
    storage: capabilities?.storage === 'local' ? 'local' : false,
    timers: capabilities?.timers === true,
    dom: capabilities?.dom === true,
  }
}

export function clampTimeout(timeoutMs = DEFAULT_TIMEOUT_MS): number {
  if (!Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.floor(timeoutMs)))
}

function clampOutputBytes(maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES): number {
  if (!Number.isFinite(maxOutputBytes)) return DEFAULT_MAX_OUTPUT_BYTES
  return Math.min(MAX_OUTPUT_BYTES, Math.max(MIN_OUTPUT_BYTES, Math.floor(maxOutputBytes)))
}

/** Cancels every in-flight execution. Each future run gets a fresh Worker. */
export function resetSandbox(): void {
  for (const cancel of [...activeCancellations]) cancel()
}

/**
 * Runs learner source in an isolated Web Worker and evaluates the given
 * probe expressions against the resulting scope. Cancellable and
 * resource-limited via a hard wall-clock timeout (docs/12) — a runaway
 * loop cannot freeze the page; it terminates the worker outright.
 */
export function execute(
  source: string,
  probes: string[] = [],
  options: ExecutionOptions = {},
): Promise<ExecutionResult> {
  const timeoutMs = clampTimeout(options.timeoutMs)
  const maxOutputBytes = clampOutputBytes(options.maxOutputBytes)
  const requestId = nextRequestId++

  return new Promise((resolve) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    } catch (err) {
      resolve(workerFailure(err instanceof Error ? err.message : String(err)))
      return
    }

    activeWorkers.add(worker)
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const finish = (result: ExecutionResult) => {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      worker.onmessage = null
      worker.onerror = null
      worker.onmessageerror = null
      worker.terminate()
      activeWorkers.delete(worker)
      activeCancellations.delete(cancel)
      resolve(result)
    }

    const cancel = () => {
      finish({
        success: false,
        error: { message: 'This run was cancelled when the runtime reset.', raw: 'execution cancelled' },
        logs: [],
        probes: {},
        durationMs: 0,
        cancelled: true,
      })
    }
    activeCancellations.add(cancel)

    timer = setTimeout(() => {
      finish({
        success: false,
        error: {
          message: 'Your code took too long to run. Check for a loop that never ends.',
          raw: `execution exceeded ${timeoutMs}ms`,
        },
        logs: [],
        probes: {},
        durationMs: timeoutMs,
        timedOut: true,
      })
    }, timeoutMs)

    worker.onmessage = (ev: MessageEvent<{ requestId: number; result: ExecutionResult }>) => {
      if (ev.data.requestId !== requestId) return
      finish(ev.data.result)
    }

    worker.onerror = (event) => {
      event.preventDefault()
      finish(workerFailure(event.message || 'The code worker stopped unexpectedly.'))
    }
    worker.onmessageerror = () => finish(workerFailure('The code worker returned an unreadable result.'))

    try {
      worker.postMessage({ type: 'run', requestId, source, probes, maxOutputBytes, capabilities: normalizeCapabilities(options.capabilities ?? DEFAULT_RUNTIME_MANIFEST.capabilities) })
    } catch (err) {
      finish(workerFailure(err instanceof Error ? err.message : String(err)))
    }
  })
}

function workerFailure(raw: string): ExecutionResult {
  return {
    success: false,
    error: { message: 'Your code could not be started. Reset the runtime and try again.', raw },
    logs: [],
    probes: {},
    durationMs: 0,
  }
}
