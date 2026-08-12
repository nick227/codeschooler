import { DEFAULT_RUNTIME_MANIFEST, type ExecutionOptions, type ExecutionResult, type RuntimeCapabilities } from './types'
import { clampTimeout, normalizeCapabilities } from './runner'

const activeFrames = new Set<HTMLIFrameElement>()

function cspFor(capabilities: RuntimeCapabilities): string {
  const connect = Array.isArray(capabilities.network) && capabilities.network.length
    ? `connect-src ${capabilities.network.join(' ')}`
    : "connect-src 'none'"
  // Scripts are inline because srcdoc is an opaque document. Everything not
  // explicitly needed by a learning preview is disabled.
  // unsafe-eval is limited to this credentialless opaque document and is
  // required to turn arbitrary learner text into a catchable program. It does
  // not permit loading any external script.
  return `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; ${connect}; base-uri 'none'; form-action 'none'`
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function buildDomSandboxDocument(
  source: string,
  capabilities: RuntimeCapabilities,
  maxOutputBytes: number,
  token: string,
  probes: string[] = [],
): string {
  const csp = cspFor(capabilities)
  const config = safeJson({ token, source, maxOutputBytes, timers: capabilities.timers, storage: capabilities.storage, network: capabilities.network, probes })
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
    const hostFetch = window.fetch.bind(window);
    if (Array.isArray(config.network)) {
      const restrictedFetch = (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
        if (!config.network.includes(url.origin)) return Promise.reject(new TypeError('Network access to ' + url.origin + ' is not allowed.'));
        return hostFetch(input, { ...init, credentials: 'omit' });
      };
      Object.defineProperty(window, 'fetch', { value: restrictedFetch, writable: false, configurable: false });
    } else {
      Object.defineProperty(window, 'fetch', { value: undefined, writable: false, configurable: false });
    }
    for (const capability of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'indexedDB', 'caches']) {
      try { Object.defineProperty(window, capability, { value: undefined, writable: false, configurable: false }); } catch {}
    }
    if (!config.timers) {
      Object.defineProperties(window, { setTimeout: { value: undefined }, setInterval: { value: undefined }, requestAnimationFrame: { value: undefined } });
    }
    const memory = new Map();
    const isolatedStorage = { get length(){ return memory.size }, key:i=>[...memory.keys()][i] ?? null, getItem:k=>memory.get(String(k)) ?? null, setItem:(k,v)=>memory.set(String(k),String(v)), removeItem:k=>memory.delete(String(k)), clear:()=>memory.clear() };
    try { Object.defineProperty(window, 'localStorage', { value: config.storage === 'local' ? isolatedStorage : undefined }); } catch {}
    try { Object.defineProperty(window, 'sessionStorage', { value: undefined }); } catch {}
    Promise.resolve().then(async () => {
      try {
        (0, eval)(config.source);
        const probes = {};
        for (const expr of config.probes || []) {
          try {
            let value = (0, eval)(expr);
            if (value && typeof value.then === 'function') value = await value;
            probes[expr] = { ok: true, value };
          } catch (error) {
            probes[expr] = { ok: false, error: error instanceof Error ? error.message : String(error) };
          }
        }
        send({ success: true, logs, probes, durationMs: 0, outputTruncated });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ success: false, error: { message, raw: message }, logs, probes: {}, durationMs: 0, outputTruncated });
      }
    });
  })();
  </script>`
}

/** Execute browser/DOM code in a disposable opaque-origin iframe. */
export function executeDom(source: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
  if (typeof document === 'undefined') return Promise.resolve({ success: false, error: { message: 'A browser preview is not available here.', raw: 'document unavailable' }, logs: [], probes: {}, durationMs: 0 })
  const timeoutMs = clampTimeout(options.timeoutMs)
  const capabilities = normalizeCapabilities({ ...options.capabilities, dom: true })
  const maxOutputBytes = Math.min(1024 * 1024, Math.max(256, options.maxOutputBytes ?? DEFAULT_RUNTIME_MANIFEST.maxOutputBytes))
  const probes = options.probes ?? []
  const frame = document.createElement('iframe')
  const token = crypto.randomUUID()
  frame.hidden = true
  frame.title = 'Isolated code preview runtime'
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
    frame.srcdoc = buildDomSandboxDocument(source, capabilities, maxOutputBytes, token, probes)
  })
}

export function resetDomSandbox(): void {
  for (const frame of [...activeFrames]) {
    frame.srcdoc = ''
    frame.remove()
    activeFrames.delete(frame)
  }
}
