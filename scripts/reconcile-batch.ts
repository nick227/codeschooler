import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { selectNextBatch } from './select-next-batch'

const root = resolve(__dirname, '..')
const batchStatePath = join(root, 'content/batch-state.json')

interface BatchState {
  activeBatch?: {
    id: string
    pattern: string
    difficulty: string
    progression: string
    status: 'pending' | 'accepted' | 'rejected'
    rejectionReason?: 'schema' | 'taxonomy' | 'duplicate' | 'quality'
    timestamp: string
    attempts: number
  }
  history: Array<{
    id: string
    pattern: string
    difficulty: string
    progression: string
    status: string
    rejectionReason?: string
    timestamp: string
  }>
}

export function reconcileBatch(action: 'accept' | 'reject', reason?: 'schema' | 'taxonomy' | 'duplicate' | 'quality') {
  let state: BatchState = { history: [] }

  if (existsSync(batchStatePath)) {
    try {
      state = JSON.parse(readFileSync(batchStatePath, 'utf-8'))
    } catch {
      state = { history: [] }
    }
  }

  const current = state.activeBatch
  const timestamp = new Date().toISOString()

  if (action === 'accept') {
    console.log(`\n✅ BATCH ACCEPTED`)
    if (current) {
      current.status = 'accepted'
      current.timestamp = timestamp
      state.history.push({ ...current })
      delete state.activeBatch
      console.log(`   Accepted target: ${current.pattern} (${current.difficulty})`)
    } else {
      console.log(`   No active batch was pending; recorded generic acceptance.`)
    }

    writeFileSync(batchStatePath, JSON.stringify(state, null, 2), 'utf-8')

    // Automatically trigger selectNextBatch to emit next batch in loop
    console.log(`\n🔄 RECOMPUTING COVERAGE & SELECTING NEXT TARGET...`)
    return selectNextBatch()
  }

  if (action === 'reject') {
    const rejReason = reason || 'quality'
    console.log(`\n❌ BATCH REJECTED (Reason: ${rejReason})`)

    if (current) {
      current.status = 'rejected'
      current.rejectionReason = rejReason
      current.timestamp = timestamp
      current.attempts = (current.attempts || 1) + 1
      state.history.push({ ...current })

      console.log(`\n💡 REASON-AWARE RETRY INSTRUCTION:`)
      if (rejReason === 'schema' || rejReason === 'taxonomy') {
        console.log(`   [RETRY SAME TARGET] Fix ${rejReason.toUpperCase()} formatting errors without changing target specs.`)
      } else {
        console.log(`   [REGENERATE TARGET] Target rejected for ${rejReason.toUpperCase()}. Generate an alternative problem variant with stronger test fixtures.`)
      }
    }

    writeFileSync(batchStatePath, JSON.stringify(state, null, 2), 'utf-8')
    return current
  }
}

// CLI handler
if (process.argv[1] === __filename) {
  const isAccept = process.argv.includes('--accept')
  const isReject = process.argv.includes('--reject')

  const reasonArg = process.argv.find((a) => a.startsWith('--reason='))
  const reason = reasonArg ? (reasonArg.split('=')[1] as 'schema' | 'taxonomy' | 'duplicate' | 'quality') : undefined

  if (isAccept) {
    reconcileBatch('accept')
  } else if (isReject) {
    reconcileBatch('reject', reason)
  } else {
    console.log(`Usage: pnpm batch:reconcile --accept OR pnpm batch:reconcile --reject [--reason=schema|taxonomy|duplicate|quality]`)
  }
}
