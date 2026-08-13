import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import { patternDisplayName } from '../apps/web/src/utils/skills'

const root = resolve(__dirname, '..')
const interviewDir = join(root, 'content/javascript/interview')
const targetsPath = join(root, 'content/coverage-targets.yaml')

interface InterviewFile {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  pattern: string
  progression?: 'intro' | 'standard' | 'transfer' | 'advanced'
  challenge: {
    skills: string[]
  }
}

interface TargetSpec {
  status?: string
  notes?: string
  target?: {
    easy?: number
    medium?: number
    hard?: number
  }
}

interface CoverageTargetsFile {
  patterns: Record<string, TargetSpec>
}

// Canonical skill mappings per pattern to ensure generated specs carry correct required skills
const PATTERN_DEFAULT_SKILLS: Record<string, string[]> = {
  'heaps': ['javascript.algorithms_heaps'],
  'union-find': ['javascript.algorithms_union_find', 'javascript.graphs'],
  'shortest-path': ['javascript.algorithms_bfs', 'javascript.graphs'],
  'arrays-and-strings': ['javascript.arrays', 'javascript.strings'],
  'linked-lists': ['javascript.linked_lists', 'javascript.algorithms_two_pointers'],
  'backtracking': ['javascript.algorithms_backtracking', 'javascript.algorithms_dfs'],
  'intervals': ['javascript.algorithms_intervals', 'javascript.arrays'],
  'sliding-window': ['javascript.algorithms_sliding_window', 'javascript.arrays'],
  'two-pointers': ['javascript.algorithms_two_pointers', 'javascript.arrays'],
  'hash-maps': ['javascript.algorithms_hash_maps', 'javascript.objects'],
  'greedy': ['javascript.algorithms_greedy', 'javascript.arrays'],
  'bfs': ['javascript.algorithms_bfs', 'javascript.queues'],
  'binary-search': ['javascript.algorithms_binary_search', 'javascript.arrays'],
  'design': ['javascript.system_design_utility', 'javascript.maps'],
  'prefix-sums': ['javascript.algorithms_prefix_sums', 'javascript.arrays'],
  'topological-sort': ['javascript.algorithms_topo_sort', 'javascript.graphs'],
  'dfs': ['javascript.algorithms_dfs', 'javascript.graphs'],
  'stacks': ['javascript.stacks', 'javascript.algorithms_monotonic_stack'],
  'matrices': ['javascript.arrays'],
  'graphs': ['javascript.graphs'],
  'sorting': ['javascript.algorithms_sorting_strategy', 'javascript.arrays'],
  'binary-trees': ['javascript.binary_trees', 'javascript.algorithms_dfs'],
  'dynamic-programming': ['javascript.algorithms_dp', 'javascript.arrays'],
}

export function selectNextBatch() {
  const interviewFiles = readdirSync(interviewDir).filter((f) => f.endsWith('.yaml'))
  const targets = (parseYaml(readFileSync(targetsPath, 'utf-8')) as CoverageTargetsFile).patterns

  const currentCounts: Record<string, { easy: number; medium: number; hard: number; total: number }> = {}

  for (const file of interviewFiles) {
    const raw = readFileSync(join(interviewDir, file), 'utf-8')
    try {
      const parsed = parseYaml(raw) as InterviewFile
      const pat = parsed.pattern || 'unspecified'
      if (!currentCounts[pat]) {
        currentCounts[pat] = { easy: 0, medium: 0, hard: 0, total: 0 }
      }
      const c = currentCounts[pat]
      c.total++
      if (parsed.difficulty && c[parsed.difficulty] !== undefined) {
        c[parsed.difficulty]++
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e)
    }
  }

  // Find all unmet targets (respecting caps)
  const unmetTargets: Array<{
    pattern: string
    difficulty: 'easy' | 'medium' | 'hard'
    progression: 'intro' | 'standard' | 'transfer' | 'advanced'
    delta: number
    priorityScore: number
    reason: string
  }> = []

  let totalPatternsSatisfied = 0

  for (const [pattern, spec] of Object.entries(targets)) {
    if (spec.status === 'deepen-only') {
      continue
    }

    const counts = currentCounts[pattern] || { easy: 0, medium: 0, hard: 0, total: 0 }
    const targetSpec = spec.target || {}

    let patternFullyMet = true

    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const tVal = targetSpec[diff] ?? 0
      const cVal = counts[diff]

      // TARGET CAP ENFORCEMENT: If current >= target, do not generate for this tier unless allow-overage
      if (cVal < tVal && spec.status !== 'capped') {
        patternFullyMet = false
        const delta = tVal - cVal

        // Calculate priority score:
        // +100 for 0-count easy intros
        // +50 for priority expansion patterns (heaps, union-find, shortest-path)
        // +delta for remaining gaps
        let score = delta
        if (cVal === 0 && diff === 'easy') score += 100
        if (['heaps', 'union-find', 'shortest-path'].includes(pattern)) score += 50

        const progression = diff === 'easy' ? 'intro' : diff === 'medium' ? 'standard' : 'advanced'

        unmetTargets.push({
          pattern,
          difficulty: diff,
          progression,
          delta,
          priorityScore: score,
          reason: `Pattern '${patternDisplayName(pattern)}' has ${cVal} ${diff} problem(s) (Target: ${tVal}).`,
        })
      }
    }

    if (patternFullyMet) totalPatternsSatisfied++
  }

  // Sort unmet targets by priority score descending
  unmetTargets.sort((a, b) => b.priorityScore - a.priorityScore)

  if (unmetTargets.length === 0) {
    const output = {
      status: 'ALL_TARGETS_SATISFIED',
      message: 'All curriculum pattern targets have been satisfied or capped. Deepen landmark problems only.',
      nextBatchRequest: null,
    }
    console.log(JSON.stringify(output, null, 2))
    return output
  }

  const topTarget = unmetTargets[0]
  const batchRequest = {
    target: {
      pattern: topTarget.pattern,
      patternTitle: patternDisplayName(topTarget.pattern),
      difficulty: topTarget.difficulty,
      progression: topTarget.progression,
      count: 1,
      requiredSkills: PATTERN_DEFAULT_SKILLS[topTarget.pattern] || [],
      pairedKnowledge: true,
      reason: topTarget.reason,
    },
    nextQueue: unmetTargets.slice(1, 5).map((t) => ({
      pattern: t.pattern,
      difficulty: t.difficulty,
      progression: t.progression,
      reason: t.reason,
    })),
    meta: {
      totalUnmetTargets: unmetTargets.length,
      patternsSatisfied: totalPatternsSatisfied,
      totalPatternsTracked: Object.keys(targets).length,
    },
  }

  console.log(`\n=== NEXT GENERATION BATCH REQUEST ===`)
  console.log(JSON.stringify(batchRequest, null, 2))
  return batchRequest
}

if (process.argv[1] === __filename) {
  selectNextBatch()
}
