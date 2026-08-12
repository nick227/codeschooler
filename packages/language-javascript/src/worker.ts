import { buildProgram } from './program'
import type { ExecutionResult, RuntimeCapabilities } from './types'

// Runs inside a dedicated Web Worker. This protects the UI from runaway
// synchronous code, but a same-origin Worker is not by itself a network or
// storage security boundary. Capability hardening is handled separately.
interface RunMessage {
  type: 'run'
  requestId: number
  source: string
  probes: string[]
  maxOutputBytes: number
  capabilities: RuntimeCapabilities
}

const ctx = self as unknown as {
  onmessage: ((ev: { data: RunMessage }) => void) | null
  postMessage: (msg: { requestId: number; result: ExecutionResult }) => void
}

const hostFetch = globalThis.fetch?.bind(globalThis)
const hostSetTimeout = globalThis.setTimeout?.bind(globalThis)
const hostSetInterval = globalThis.setInterval?.bind(globalThis)

ctx.onmessage = (ev) => {
  const { requestId, source, probes, maxOutputBytes, capabilities } = ev.data
  const start = performance.now()

  try {
    // Re-create only authored grants for this disposable worker. Network
    // requests never carry application cookies and must match an allowlist.
    const grants: Record<string, unknown> = {
      fetch: undefined, WebSocket: undefined, EventSource: undefined,
      XMLHttpRequest: undefined, indexedDB: undefined, caches: undefined,
      BroadcastChannel: undefined, Worker: undefined, SharedWorker: undefined,
      setTimeout: capabilities.timers ? hostSetTimeout : undefined,
      setInterval: capabilities.timers ? hostSetInterval : undefined,
      importScripts: undefined,
    }
    if (Array.isArray(capabilities.network) && hostFetch) {
      const allowed = capabilities.network
      const restrictedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
        if (!allowed.includes(url.origin)) return Promise.reject(new TypeError(`Network access to ${url.origin} is not allowed.`))
        return hostFetch(input, { ...init, credentials: 'omit' })
      }
      grants.fetch = restrictedFetch
    }
    // Each execution owns a fresh Worker, so grants can be permanently locked
    // immediately before learner code is compiled.
    for (const [name, value] of Object.entries(grants)) {
      try { Object.defineProperty(globalThis, name, { value, writable: false, configurable: false }) } catch { /* host is stricter */ }
    }
    const program = buildProgram(source, probes, { maxOutputBytes })
    // eslint-disable-next-line no-new-func -- this is the sandbox; running
    // learner code is the entire point of this file.
    const run = new Function(program) as () => {
      logs: string[]
      probes: ExecutionResult['probes']
      outputTruncated: boolean
      runtimeError?: string
    }
    const { logs, probes: probeResults, outputTruncated, runtimeError } = run()

    const result: ExecutionResult = {
      success: runtimeError === undefined,
      logs,
      probes: probeResults,
      durationMs: performance.now() - start,
      outputTruncated,
      ...(runtimeError === undefined
        ? {}
        : { error: { message: friendlyRuntimeError(runtimeError), raw: runtimeError } }),
    }
    ctx.postMessage({ requestId, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const result: ExecutionResult = {
      success: false,
      error: { message: friendlyRuntimeError(message), raw: message },
      logs: [],
      probes: {},
      durationMs: performance.now() - start,
    }
    ctx.postMessage({ requestId, result })
  }
}

function friendlyRuntimeError(raw: string): string {
  if (raw.includes('is not defined')) {
    return `${raw}. Check the spelling, and make sure it was created before this line runs.`
  }
  if (raw.includes('is not a function')) {
    return `${raw}. Check that this name refers to a function.`
  }
  return raw
}
