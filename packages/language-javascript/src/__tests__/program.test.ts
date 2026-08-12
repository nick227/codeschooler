import { describe, expect, it } from 'vitest'
import { buildProgram } from '../program'

interface ProgramResult {
  logs: string[]
  probes: Record<string, { ok: boolean; value?: unknown; error?: string }>
  outputTruncated: boolean
  runtimeError?: string
}

async function runProgram(source: string, probes: string[] = [], maxOutputBytes = 1024): Promise<ProgramResult> {
  const compiled = new Function(buildProgram(source, probes, { maxOutputBytes })) as () => Promise<ProgramResult>
  return compiled()
}

describe('buildProgram', () => {
  it('captures learner output and lexical probes', async () => {
    const result = await runProgram('const score = 10; console.log("score", score)', ['score'])
    expect(result.logs).toEqual(['score 10'])
    expect(result.probes.score).toEqual({ ok: true, value: 10 })
  })

  it('does not let probe output contaminate learner output', async () => {
    const result = await runProgram('function answer() { console.log("probe noise"); return 42 }', ['answer()'])
    expect(result.logs).toEqual([])
    expect(result.probes['answer()']).toEqual({ ok: true, value: 42 })
  })

  it('caps output by UTF-8 bytes and reports truncation', async () => {
    const result = await runProgram('console.log("éééé")', [], 5)
    expect(result.logs).toEqual(['éé'])
    expect(result.outputTruncated).toBe(true)
  })

  it('retains bounded output produced before a runtime error', async () => {
    const result = await runProgram('console.log("before"); missingName()')
    expect(result.logs).toEqual(['before'])
    expect(result.runtimeError).toContain('missingName is not defined')
  })

  it('renders common console values instead of silently dropping them', async () => {
    const result = await runProgram('console.log(undefined, 10n, Symbol("x"))')
    expect(result.logs).toEqual(['undefined 10 Symbol(x)'])
  })

  it('awaits thenable probe results', async () => {
    const result = await runProgram(
      'async function answer() { return 7 }',
      ['answer()'],
    )
    expect(result.probes['answer()']).toEqual({ ok: true, value: 7 })
  })
})
