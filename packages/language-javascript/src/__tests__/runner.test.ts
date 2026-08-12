import { describe, expect, it } from 'vitest'
import { clampTimeout } from '../runner'

describe('clampTimeout', () => {
  it('keeps execution timeouts inside the supported range', () => {
    expect(clampTimeout(-1)).toBe(100)
    expect(clampTimeout(432.9)).toBe(432)
    expect(clampTimeout(99_999)).toBe(10_000)
    expect(clampTimeout(Number.NaN)).toBe(3000)
  })
})
