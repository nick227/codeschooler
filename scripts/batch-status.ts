import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import { patternDisplayName } from '../apps/web/src/utils/skills'

const root = resolve(__dirname, '..')
const interviewDir = join(root, 'content/javascript/interview')
const targetsPath = join(root, 'content/coverage-targets.yaml')
const batchStatePath = join(root, 'content/batch-state.json')

interface InterviewFile {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  pattern: string
  progression?: 'intro' | 'standard' | 'transfer' | 'advanced'
}

interface TargetSpec {
  status?: string
  notes?: string
  target?: {
    easy?: number
    medium?: number
    hard?: number
  }
  progressionTarget?: {
    intro?: number
    standard?: number
    transfer?: number
    advanced?: number
  }
}

interface CoverageTargetsFile {
  patterns: Record<string, TargetSpec>
}

interface BatchState {
  activeBatch?: {
    id: string
    pattern: string
    difficulty: string
    progression: string
    status: 'pending' | 'accepted' | 'rejected'
    rejectionReason?: 'schema' | 'taxonomy' | 'duplicate' | 'quality'
    timestamp: string
  }
  history?: Array<{
    id: string
    pattern: string
    difficulty: string
    status: string
    timestamp: string
  }>
}

export function getBatchStatus() {
  const interviewFiles = readdirSync(interviewDir).filter((f) => f.endsWith('.yaml'))
  const targets = (parseYaml(readFileSync(targetsPath, 'utf-8')) as CoverageTargetsFile).patterns

  let batchState: BatchState = {}
  if (existsSync(batchStatePath)) {
    try {
      batchState = JSON.parse(readFileSync(batchStatePath, 'utf-8'))
    } catch {
      batchState = {}
    }
  }

  const patternStats: Record<string, {
    count: number
    easy: number
    medium: number
    hard: number
    progression: { intro: number; standard: number; transfer: number; advanced: number }
  }> = {}

  for (const file of interviewFiles) {
    const raw = readFileSync(join(interviewDir, file), 'utf-8')
    try {
      const parsed = parseYaml(raw) as InterviewFile
      const pat = parsed.pattern || 'unspecified'
      if (!patternStats[pat]) {
        patternStats[pat] = {
          count: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          progression: { intro: 0, standard: 0, transfer: 0, advanced: 0 },
        }
      }
      const p = patternStats[pat]
      p.count++
      if (parsed.difficulty) p[parsed.difficulty]++

      // Progression assignment (explicit or inferred)
      let role: 'intro' | 'standard' | 'transfer' | 'advanced' = 'standard'
      if (parsed.progression) {
        role = parsed.progression
      } else if (parsed.difficulty === 'easy') {
        role = 'intro'
      } else if (parsed.difficulty === 'hard') {
        role = 'advanced'
      } else if (p.medium > 2) {
        role = 'transfer'
      } else {
        role = 'standard'
      }
      p.progression[role]++
    } catch (e) {
      console.error(`Error reading ${file}:`, e)
    }
  }

  console.log(`\n==================================================`)
  console.log(`       CURRICULUM GENERATION CONTROLLER STATUS     `)
  console.log(`==================================================\n`)

  // 1. Active Batch Status
  if (batchState.activeBatch) {
    const b = batchState.activeBatch
    console.log(`📌 CURRENT ACTIVE BATCH:`)
    console.log(`   ID: ${b.id}`)
    console.log(`   Pattern: ${patternDisplayName(b.pattern)} (${b.pattern})`)
    console.log(`   Difficulty / Role: ${b.difficulty.toUpperCase()} / ${b.progression}`)
    console.log(`   Status: ${b.status.toUpperCase()}${b.rejectionReason ? ` (Reason: ${b.rejectionReason})` : ''}`)
    console.log(``)
  } else {
    console.log(`📌 CURRENT ACTIVE BATCH: None (Ready for next batch)\n`)
  }

  // 2. Progression Coverage Matrix
  console.log(`📊 PROGRESSION COVERAGE MATRIX:`)
  console.log(`| Pattern | Total | Intro | Standard | Transfer | Advanced | Tier Health |`)
  console.log(`|---|---|---|---|---|---|---|`)

  const sortedPatterns = Object.entries(patternStats).sort((a, b) => b[1].count - a[1].count)

  let satisfiedCount = 0
  let totalTracked = Object.keys(targets).length

  for (const [slug, stats] of sortedPatterns) {
    const pName = patternDisplayName(slug)
    const prog = stats.progression
    const targetSpec = targets[slug]?.target
    const isDeepenOnly = targets[slug]?.status === 'deepen-only'

    let health = '🟢 Balanced'
    if (isDeepenOnly) {
      health = '⏸️ Deepen-only'
    } else if (stats.easy === 0 && (targetSpec?.easy ?? 0) > 0) {
      health = '🚨 Missing Intro'
    } else if (stats.hard === 0 && (targetSpec?.hard ?? 0) > 0 && stats.count >= 4) {
      health = '⚠️ Needs Capstone'
    }

    if (targets[slug] && stats.easy >= (targetSpec?.easy ?? 0) && stats.medium >= (targetSpec?.medium ?? 0) && stats.hard >= (targetSpec?.hard ?? 0)) {
      satisfiedCount++
    }

    console.log(`| **${pName}** | ${stats.count} | ${prog.intro} | ${prog.standard} | ${prog.transfer} | ${prog.advanced} | ${health} |`)
  }

  console.log(`\n📈 COVERAGE SUMMARY: ${satisfiedCount}/${totalTracked} pattern target profiles satisfied.`)
  console.log(`==================================================\n`)

  return {
    activeBatch: batchState.activeBatch ?? null,
    patternStats,
    satisfiedCount,
    totalTracked,
  }
}

if (process.argv[1] === __filename) {
  getBatchStatus()
}
