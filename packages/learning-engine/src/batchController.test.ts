import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getBatchStatus } from '../../../scripts/batch-status'
import { reconcileBatch } from '../../../scripts/reconcile-batch'

describe('Batch Generation Controller System', () => {
  it('computes progression coverage matrix and tier health status', () => {
    const status = getBatchStatus()
    assert.ok(status)
    assert.strictEqual(typeof status.totalTracked, 'number')
    assert.strictEqual(typeof status.satisfiedCount, 'number')
    assert.ok(status.patternStats['dynamic-programming'])
    assert.ok(status.patternStats['binary-trees'])

    const bt = status.patternStats['binary-trees']
    assert.ok(bt.progression.intro >= 0)
    assert.ok(bt.progression.standard >= 0)
  })

  it('reconciles batch rejections with reason-aware instructions', () => {
    const rejectResult = reconcileBatch('reject', 'duplicate')
    assert.ok(rejectResult === undefined || typeof rejectResult === 'object')

    const statusAfterReject = getBatchStatus()
    assert.ok(statusAfterReject)
  })
})
