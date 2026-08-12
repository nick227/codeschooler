import { describe, expect, it } from 'vitest'
import { observeSource, parse } from '../parse'

describe('observeSource', () => {
  it.each([
    ['', 'empty'],
    ['   \n', 'empty'],
    ['const', 'incomplete'],
    ['const score', 'incomplete'],
    ['const score =', 'incomplete'],
    ['const score = 10', 'valid'],
  ] as const)('classifies %j as %s', (source, state) => {
    expect(observeSource(source).state).toBe(state)
  })

  it('distinguishes invalid syntax from an unfinished line', () => {
    const observation = observeSource('const = 10')
    expect(observation.state).toBe('invalid')
    expect(observation.runnable).toBe(false)
    expect(observation.diagnostic?.raw).toContain('Unexpected token')
  })

  it('uses neutral language for an incomplete declaration', () => {
    const observation = observeSource('const score =')
    expect(observation.diagnostic?.message).toBe('This line cannot run yet because it is not finished.')
    expect(observation.diagnostic?.raw).toContain('Unexpected token')
  })

  it('keeps strict parse as the runnable authority', () => {
    expect(parse('const score =').valid).toBe(false)
    expect(parse('const score = 10').valid).toBe(true)
  })
})
