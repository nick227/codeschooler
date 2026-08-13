import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'

const root = resolve(__dirname, '..')
const skillsYamlPath = join(root, 'content/skills.yaml')
const targetTsPath = process.env.TARGET_TS_PATH ? resolve(process.env.TARGET_TS_PATH) : join(root, 'apps/web/src/utils/skills.ts')

interface SkillEntry {
  id: string
  name: string
}

const DEFAULT_PATTERNS: Record<string, string> = {
  'arrays-and-strings': 'Arrays & Strings',
  'backtracking': 'Backtracking',
  'bfs': 'Breadth-First Search',
  'binary-search': 'Binary Search',
  'binary-trees': 'Binary Trees',
  'design': 'System Design',
  'dfs': 'Depth-First Search',
  'dynamic-programming': 'Dynamic Programming',
  'graphs': 'Graphs',
  'greedy': 'Greedy Choice',
  'hash-maps': 'Hash Maps',
  'heaps': 'Heaps & Priority Queues',
  'intervals': 'Intervals',
  'linked-lists': 'Linked Lists',
  'matrices': 'Matrices',
  'prefix-sums': 'Prefix Sums',
  'shortest-path': 'Shortest Path',
  'sliding-window': 'Sliding Window',
  'sorting': 'Sorting',
  'stacks': 'Stacks',
  'topological-sort': 'Topological Sort',
  'two-pointers': 'Two Pointers',
  'union-find': 'Union-Find',
}

export function generateSkillsMap() {
  const rawSkills = readFileSync(skillsYamlPath, 'utf-8')
  const parsedSkills = parseYaml(rawSkills) as { skills: SkillEntry[] }
  const skillMap: Record<string, string> = {}

  for (const s of parsedSkills.skills) {
    if (s.id && s.name) {
      skillMap[s.id] = s.name
    }
  }

  // Scan interview files for any additional pattern slugs
  const interviewDir = join(root, 'content/javascript/interview')
  const interviewFiles = readdirSync(interviewDir).filter((f) => f.endsWith('.yaml'))
  const foundPatterns = new Set<string>()

  for (const file of interviewFiles) {
    const raw = readFileSync(join(interviewDir, file), 'utf-8')
    const parsed = parseYaml(raw) as { pattern?: string }
    if (parsed.pattern) {
      foundPatterns.add(parsed.pattern)
    }
  }

  const patternMap: Record<string, string> = { ...DEFAULT_PATTERNS }
  for (const p of foundPatterns) {
    if (!patternMap[p]) {
      patternMap[p] = p.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }

  const output = `// AUTO-GENERATED from content/skills.yaml and interview patterns — DO NOT EDIT DIRECTLY.
// Generated via \`pnpm taxonomy:generate\` (scripts/generate-skills-map.ts).

export const SKILL_NAMES: Record<string, string> = ${JSON.stringify(skillMap, null, 2)}

/**
 * Returns the human-readable name for a skill ID.
 * Falls back to a capitalised version of the last segment if the ID is unmapped.
 */
export function skillDisplayName(id: string): string {
  return SKILL_NAMES[id] ?? id.split('.').pop()?.replace(/_/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase()) ?? id
}

export const PATTERN_NAMES: Record<string, string> = ${JSON.stringify(patternMap, null, 2)}

/**
 * Returns the human-readable display name for an interview pattern slug.
 */
export function patternDisplayName(pattern: string): string {
  return PATTERN_NAMES[pattern] ?? pattern.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
`

  writeFileSync(targetTsPath, output, 'utf-8')
  console.log(`✓ Generated ${Object.keys(skillMap).length} skills and ${Object.keys(patternMap).length} pattern names -> apps/web/src/utils/skills.ts`)
}

if (process.argv[1] === __filename) {
  generateSkillsMap()
}
