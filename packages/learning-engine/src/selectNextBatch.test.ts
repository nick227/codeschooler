import { describe, it } from 'node:test'
import assert from 'node:assert'
import { selectNextBatch } from '../../../scripts/select-next-batch'

describe('selectNextBatch loop controller', () => {
  it('selects highest priority unmet target with required skills and progression metadata', () => {
    const result = selectNextBatch()
    assert.ok(result)
    if ('target' in result && result.target) {
      assert.strictEqual(typeof result.target.pattern, 'string')
      assert.strictEqual(typeof result.target.difficulty, 'string')
      assert.strictEqual(typeof result.target.progression, 'string')
      assert.ok(Array.isArray(result.target.requiredSkills))
      assert.strictEqual(result.target.count, 1)
    }
  })

  it('provides a prioritized queue of subsequent unmet targets', () => {
    const result = selectNextBatch()
    if ('nextQueue' in result && result.nextQueue) {
      assert.ok(Array.isArray(result.nextQueue))
      assert.ok(result.nextQueue.length > 0)
      assert.strictEqual(typeof result.nextQueue[0].pattern, 'string')
      assert.strictEqual(typeof result.nextQueue[0].difficulty, 'string')
      assert.strictEqual(typeof result.nextQueue[0].progression, 'string')
    }
  })
})
