import { getQuickJS } from 'quickjs-emscripten'
import type { Challenge } from '@code-trainer/content-schema'
import { parse } from 'acorn'
import { randomBytes } from 'node:crypto'

const SERVER_TIMEOUT_CAP_MS = 2_000
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
    try {
      // Parse as a Script before wrapping. This rejects top-level return and
      // other constructs that would be legal only because of our function.
      parse(source, { ecmaVersion: 'latest', sourceType: 'script' })
    } catch (error) {
      return this.resultForFailure(error instanceof Error ? error.message : 'Invalid JavaScript', false, 0)
    }

    const QuickJS = await getQuickJS()
    const runtime = QuickJS.newRuntime()
    runtime.setMemoryLimit(MEMORY_BYTES)
    runtime.setMaxStackSize(STACK_BYTES)
    const timeoutMs = Math.min(SERVER_TIMEOUT_CAP_MS, challenge.runtime.timeoutMs)
    const outputBytes = Math.min(OUTPUT_BYTES, challenge.runtime.maxOutputBytes)
    const deadline = Date.now() + timeoutMs
    runtime.setInterruptHandler(() => Date.now() >= deadline)
    const context = runtime.newContext()

    try {
      const program = buildSandboxProgram(source, probesForChecks(challenge.checks), outputBytes, randomBytes(16).toString('hex'))
      const evaluated = context.evalCode(`(function () { ${program}\n})()`)
      if (evaluated.error) {
        const error = context.dump(evaluated.error) as { message?: string }
        evaluated.error.dispose()
        const timedOut = Date.now() >= deadline
        return this.resultForFailure(timedOut ? 'Execution timed out' : String(error?.message ?? error), timedOut, timeoutMs)
      }

      const dumped = context.dump(evaluated.value) as {
        logs?: string[]
        probes?: Record<string, { ok: boolean; value?: unknown; error?: string }>
        outputTruncated?: boolean
        runtimeError?: string
      }
      evaluated.value.dispose()
      const execution = {
        success: dumped.runtimeError === undefined,
        logs: dumped.logs ?? [],
        probes: dumped.probes ?? {},
        durationMs: Math.min(timeoutMs, Math.max(0, timeoutMs - (deadline - Date.now()))),
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

  private resultForFailure(message: string, timedOut: boolean, timeoutMs: number) {
    return {
      execution: {
        success: false,
        error: { message, raw: message },
        logs: [],
        probes: {},
        durationMs: timeoutMs,
        ...(timedOut ? { timedOut: true } : {}),
      },
      outcomes: [],
      checksPassed: false,
      complete: false,
      runRequired: false,
    }
  }
}

function probesForChecks(checks: Challenge['checks']): string[] {
  const probes = new Set<string>()
  for (const check of checks) {
    if (check.type === 'variableExists' || check.type === 'variableEquals' || check.type === 'functionExists') {
      probes.add(`typeof ${check.name}`)
      if (check.type === 'variableEquals') probes.add(check.name)
    } else if (check.type === 'functionReturns') {
      probes.add(`typeof ${check.name}`)
      probes.add(`${check.name}(${check.args.map((arg) => JSON.stringify(arg)).join(',')})`)
    }
  }
  return [...probes]
}

function evaluateChecks(checks: Challenge['checks'], execution: { logs: string[]; probes: Record<string, { ok: boolean; value?: unknown }> }) {
  return checks.map((check) => {
    let passed = false
    if (check.type === 'variableExists') passed = execution.probes[`typeof ${check.name}`]?.value !== 'undefined'
    if (check.type === 'variableEquals') passed = deepEqual(execution.probes[check.name]?.value, check.value)
    if (check.type === 'functionExists') passed = execution.probes[`typeof ${check.name}`]?.value === 'function'
    if (check.type === 'functionReturns') {
      passed = deepEqual(execution.probes[`${check.name}(${check.args.map((arg) => JSON.stringify(arg)).join(',')})`]?.value, check.value)
    }
    if (check.type === 'outputEquals') passed = execution.logs.join('\n').trim() === check.value.trim()
    if (check.type === 'outputContains') passed = execution.logs.join('\n').includes(check.value)
    return { passed }
  })
}

function isComplete(outcomes: Array<{ passed: boolean }>) { return outcomes.length > 0 && outcomes.every(({ passed }) => passed) }

function buildSandboxProgram(source: string, probes: string[], maxOutputBytes: number, nonce: string): string {
  const prefix = `__ct_${nonce}_`
  const n = (name: string) => `${prefix}${name}`
  const statements = probes.map((probe) => `try { ${n('probes')}[${JSON.stringify(probe)}] = {ok:true,value:${n('safe')}(${probe})}; } catch(${n('probeError')}) { ${n('probes')}[${JSON.stringify(probe)}]={ok:false,error:String(${n('probeError')})}; }`).join('\n')
  return `"use strict";
    const ${n('logs')}=[]; let ${n('bytes')}=0; let ${n('truncated')}=false;
    const ${n('safe')}=(v)=>{if(typeof v==='function')return '[Function]';if(typeof v==='undefined')return undefined;try{return JSON.parse(JSON.stringify(v))}catch{return String(v)}};
    const ${n('size')}=(s)=>{let x=0;for(const c of s){const p=c.codePointAt(0);x+=p<=127?1:p<=2047?2:p<=65535?3:4}return x};
    const console={log:(...a)=>{const s=a.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ');const x=${n('size')}(s);if(${n('bytes')}+x<=${maxOutputBytes}){${n('logs')}.push(s);${n('bytes')}+=x}else{${n('truncated')}=true}},warn:(...a)=>console.log(...a),error:(...a)=>console.log(...a),info:(...a)=>console.log(...a)};
    try { ${source}\n const ${n('learnerLogs')}=${n('logs')}.slice(); const ${n('probes')}={}; ${statements}\n return {logs:${n('learnerLogs')},probes:${n('probes')},outputTruncated:${n('truncated')}}; }
    catch(${n('runtimeError')}){return {logs:${n('logs')},probes:{},outputTruncated:${n('truncated')},runtimeError:${n('runtimeError')}&&${n('runtimeError')}.message?String(${n('runtimeError')}.message):String(${n('runtimeError')})}}`
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => deepEqual(value, b[index]))
  }
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const keys = Object.keys(left)
  return keys.length === Object.keys(right).length && keys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]))
}
