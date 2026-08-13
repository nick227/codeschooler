import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import {
  loadAndValidateCatalog,
  scoreInterviewProblem,
  listInterviewProblems,
} from '@code-trainer/learning-engine'
import type { InterviewProblem } from '@code-trainer/content-schema'
import { selectNextBatch } from './select-next-batch'
import { getBatchStatus } from './batch-status'
import { reconcileBatch } from './reconcile-batch'

const root = resolve(__dirname, '..')

export function runBatchLoop(candidateFilePath?: string) {
  console.log(`\n==================================================`)
  console.log(` 🔄 AUTOMATED CURRICULUM GENERATION CONTROLLER LOOP`)
  console.log(`==================================================\n`)

  // Step 1: Evaluate schema & catalog validity
  console.log(`[1/5] Validating catalog schema & cross-document integrity...`)
  const { catalog, errors: schemaErrors } = loadAndValidateCatalog()

  if (schemaErrors.length > 0) {
    console.error(`❌ Catalog has ${schemaErrors.length} schema/cross-reference error(s):`)
    for (const err of schemaErrors.slice(0, 5)) {
      console.error(`   - ${err}`)
    }
    console.log(`\n⚠️ Halting loop until catalog schema errors are resolved.`)
    return { status: 'SCHEMA_ERROR', errors: schemaErrors }
  }

  console.log(`✓ Catalog schema valid (${catalog.interviewProblems.length} interview problems).`)

  // Step 2: Select next target
  console.log(`\n[2/5] Selecting next priority target (pnpm batch:next)...`)
  const nextTargetResult = selectNextBatch()

  if (!('target' in nextTargetResult) || !nextTargetResult.target) {
    console.log(`\n🎉 All curriculum pattern targets satisfied or capped!`)
    getBatchStatus()
    return { status: 'COMPLETED', message: 'All targets satisfied.' }
  }

  const target = nextTargetResult.target

  // Step 3: If candidate file provided, evaluate quality & similarity
  if (candidateFilePath && existsSync(resolve(candidateFilePath))) {
    console.log(`\n[3/5] Evaluating candidate file: ${candidateFilePath}...`)
    const raw = readFileSync(resolve(candidateFilePath), 'utf-8')
    let candidateProblem: InterviewProblem

    try {
      candidateProblem = parseYaml(raw) as InterviewProblem
    } catch (e) {
      console.error(`❌ Ingestion failed — YAML parse error:`, e)
      reconcileBatch('reject', 'schema')
      return { status: 'REJECTED', reason: 'schema' }
    }

    const existingProblems = listInterviewProblems()
    const qualityResult = scoreInterviewProblem(candidateProblem, existingProblems)

    console.log(`   Quality Score: ${qualityResult.score}/100 | Passed: ${qualityResult.passed ? 'YES' : 'NO'}`)

    if (qualityResult.issues.length > 0) {
      console.log(`   Issues:`)
      for (const issue of qualityResult.issues) {
        console.log(`     - [${issue.severity.toUpperCase()}] ${issue.detail}`)
      }
    }

    if (qualityResult.reviewFlags.length > 0) {
      console.log(`   Admin Review Flags:`)
      for (const flag of qualityResult.reviewFlags) {
        console.log(`     - ⚠️  ${flag}`)
      }
    }

    // Step 4: Reconcile based on quality score
    console.log(`\n[4/5] Reconciling batch...`)
    if (!qualityResult.passed) {
      const dupIssue = qualityResult.issues.find((i) => i.code === 'duplicate_similarity')
      const reason = dupIssue ? 'duplicate' : 'quality'
      reconcileBatch('reject', reason)
      return { status: 'REJECTED', reason, qualityResult }
    } else {
      reconcileBatch('accept')
    }
  } else {
    console.log(`\n[3/5] No candidate file provided to ingest in this cycle. Target emitted.`)
  }

  // Step 5: Render updated status
  console.log(`\n[5/5] Current Controller Status & Progression Coverage (pnpm batch:status):`)
  const status = getBatchStatus()

  return {
    status: 'ACTIVE',
    target,
    summary: status,
  }
}

if (process.argv[1] === __filename) {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))
  const candidateFile = fileArg ? fileArg.split('=')[1] : undefined
  runBatchLoop(candidateFile)
}
