// The JavaScript language adapter's public contract. Future language
// adapters (Python, etc.) implement the same shape without touching
// curriculum, navigation, or progress code (docs/12-evaluation-language-platform.md).

export interface Diagnostic {
  /** Beginner-facing translation. */
  message: string
  /** The original parser message, always preserved (docs/10). */
  raw: string
  line: number
  column: number
  severity: 'error'
}

export interface ParseResult {
  valid: boolean
  diagnostic?: Diagnostic
}

export type SourceObservationState = 'empty' | 'incomplete' | 'invalid' | 'valid'

/** A non-executing view of source suitable for editor/HUD updates. */
export interface SourceObservation {
  state: SourceObservationState
  /** True only when the source can be sent to the runtime. */
  runnable: boolean
  diagnostic?: Diagnostic
}

export interface ProbeResult {
  ok: boolean
  /** JSON-safe snapshot of the probe expression's value. */
  value?: unknown
  error?: string
}

export interface ExecutionResult {
  /** False only when the program threw during execution (parse errors are caught earlier by parse()). */
  success: boolean
  error?: { message: string; raw: string }
  /** One string per console.log/warn/error call, arguments joined with a space. */
  logs: string[]
  /** Keyed by the exact probe expression string requested. */
  probes: Record<string, ProbeResult>
  durationMs: number
  timedOut?: boolean
  cancelled?: boolean
  outputTruncated?: boolean
}

export interface ExecutionOptions {
  timeoutMs?: number
  maxOutputBytes?: number
  capabilities?: Partial<RuntimeCapabilities>
  probes?: string[]
}

/** Capabilities are grants: an omitted field is always denied. */
export interface RuntimeCapabilities {
  network: false | string[]
  storage: false | 'local'
  timers: boolean
  dom: boolean
}

export interface RuntimeManifest {
  environment: 'worker' | 'dom'
  timeoutMs: number
  maxOutputBytes: number
  capabilities: RuntimeCapabilities
}

export const DEFAULT_RUNTIME_MANIFEST: RuntimeManifest = {
  environment: 'worker',
  timeoutMs: 3000,
  maxOutputBytes: 64 * 1024,
  capabilities: { network: false, storage: false, timers: false, dom: false },
}
