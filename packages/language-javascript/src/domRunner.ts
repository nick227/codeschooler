import { DEFAULT_RUNTIME_MANIFEST, type ExecutionOptions, type ExecutionResult, type RuntimeCapabilities } from './types'
import { clampTimeout, normalizeCapabilities } from './runner'

const activeFrames = new Set<HTMLIFrameElement>()

function cspFor(capabilities: RuntimeCapabilities): string {
  const connect = Array.isArray(capabilities.network) && capabilities.network.length
    ? `connect-src ${capabilities.network.join(' ')}`
    : "connect-src 'none'"
  // Scripts are inline because srcdoc is an opaque document. Everything not
  // explicitly needed by a learning preview is disabled.
  return `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; ${connect}; base-uri 'none'; form-action 'none'`
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function buildDomSandboxDocument(source: string, capabilities: RuntimeCapabilities, maxOutputBytes: number, token: string): string {
  const csp = cspFor(capabilities)
  const config = safeJson({ token, source, maxOutputBytes, timers: capabilities.timers, storage: capabilities.storage })
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><div id="preview-root"></div><script>
  (() => {
    'use strict';
    const config = ${config};
    let outputBytes = 0, outputTruncated = false;
    const logs = [];
    const send = result => parent.postMessage({ type: 'code-trainer:dom-result', token: config.token, result }, '*');
    const format = value => { try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); } };
    const record = (...args) => {
      const line = args.map(format).join(' '); const bytes = new TextEncoder().encode(line + '\\n').length;
      if (outputBytes + bytes > config.maxOutputBytes) { outputTruncated = true; return; }
      outputBytes += bytes; logs.push(line);
    };
    console.log = record; console.warn = record; console.error = record;
    if (!config.timers) {
      Object.defineProperties(window, { setTimeout: { value: undefined }, setInterval: { value: undefined }, requestAnimationFrame: { value: undefined } });
    }
    // Opaque origin already blocks ambient storage. A challenge may opt into
    // an isolated in-memory localStorage-compatible store; it is never app storage.
    const memory = new Map();
    const isolatedStorage = { get length(){ return memory.size }, key:i=>[...memory.keys()][i] ?? null, getItem:k=>memory.get(String(k)) ?? null, setItem:(k,v)=>memory.set(String(k),String(v)), removeItem:k=>memory.delete(String(k)), clear:()=>memory.clear() };
    try { Object.defineProperty(window, 'localStorage', { value: config.storage === 'local' ? isolatedStorage : undefined }); } catch {}
    try { Object.defineProperty(window, 'sessionStorage', { value: undefined }); } catch {}
    try {
      (0, eval)(config.source);
      send({ success: true, logs, probes: {}, durationMs: 0, outputTruncated });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send({ success: false, error: { message, raw: message }, logs, probes: {}, durationMs: 0, outputTruncated });
    }
  })();
  </script>`
}

/** Execute browser/DOM code in a disposable opaque-origin iframe. */
export function executeDom(source: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
  if (typeof document === 'undefined') return Promise.resolve({ success: false, error: { message: 'A browser preview is not available here.', raw: 'document unavailable' }, logs: [], probes: {}, durationMs: 0 })
  const timeoutMs = clampTimeout(options.timeoutMs)
  const capabilities = normalizeCapabilities({ ...options.capabilities, dom: true })
  const maxOutputBytes = Math.min(1024 * 1024, Math.max(256, Math.floor(options.maxOutputBytes ?? DEFAULT_RUNTIME_MANIFEST.maxOutputBytes)))
  const frame = document.createElement('iframe')
  const token = crypto.randomUUID()
  frame.hidden = true
  frame.title = 'Isolated code preview runtime'
  // No allow-same-origin: srcdoc receives a unique opaque origin.
  frame.setAttribute('sandbox', 'allow-scripts')
  frame.setAttribute('referrerpolicy', 'no-referrer')
  activeFrames.add(frame)

  return new Promise((resolve) => {
    const started = performance.now()
    let settled = false
    const finish = (result: ExecutionResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      frame.srcdoc = ''
      frame.remove()
      activeFrames.delete(frame)
      resolve({ ...result, durationMs: performance.now() - started })
    }
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'code-trainer:dom-result' || event.data.token !== token) return
      finish(event.data.result as ExecutionResult)
    }
    const timer = setTimeout(() => finish({ success: false, error: { message: 'Your preview took too long to run.', raw: `execution exceeded ${timeoutMs}ms` }, logs: [], probes: {}, durationMs: timeoutMs, timedOut: true }), timeoutMs)
    window.addEventListener('message', onMessage)
    document.body.append(frame)
    frame.srcdoc = buildDomSandboxDocument(source, capabilities, maxOutputBytes, token)
  })
}

export function resetDomSandbox(): void {
  for (const frame of [...activeFrames]) {
    frame.srcdoc = ''
    frame.remove()
    activeFrames.delete(frame)
  }
}
