import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import { skillDisplayName, patternDisplayName } from '../apps/web/src/utils/skills'

const root = resolve(__dirname, '..')
const interviewDir = join(root, 'content/javascript/interview')
const knowledgeDir = join(root, 'content/knowledge/javascript')
const targetsPath = join(root, 'content/coverage-targets.yaml')

interface InterviewFile {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  pattern: string
  challenge: {
    skills: string[]
    guidance?: string
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

export function generateReport() {
  const interviewFiles = readdirSync(interviewDir).filter((f) => f.endsWith('.yaml'))
  const knowledgeFiles = readdirSync(knowledgeDir).filter((f) => f.endsWith('.yaml'))
  const targets = (parseYaml(readFileSync(targetsPath, 'utf-8')) as CoverageTargetsFile).patterns

  const patternStats: Record<string, {
    count: number
    easy: number
    medium: number
    hard: number
    skills: Set<string>
  }> = {}

  let totalInterview = 0
  for (const file of interviewFiles) {
    const raw = readFileSync(join(interviewDir, file), 'utf-8')
    try {
      const parsed = parseYaml(raw) as InterviewFile
      totalInterview++
      const pat = parsed.pattern || 'unspecified'
      if (!patternStats[pat]) {
        patternStats[pat] = { count: 0, easy: 0, medium: 0, hard: 0, skills: new Set() }
      }
      const p = patternStats[pat]
      p.count++
      if (parsed.difficulty) p[parsed.difficulty]++
      for (const s of parsed.challenge?.skills || []) {
        p.skills.add(s)
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e)
    }
  }

  console.log(`\n=== CURRICULUM COVERAGE REPORT (TARGET-DRIVEN) ===`)
  console.log(`Total Interview Problems: ${totalInterview} (across ${Object.keys(patternStats).length} normalized patterns)\n`)

  console.log(`| Pattern | Current (E/M/H) | Target (E/M/H) | Status / Needed Actions |`)
  console.log(`|---|---|---|---|`)

  const sortedPatterns = Object.entries(patternStats).sort((a, b) => b[1].count - a[1].count)

  for (const [slug, stats] of sortedPatterns) {
    const pName = patternDisplayName(slug)
    const currentStr = `${stats.easy}/${stats.medium}/${stats.hard}`
    const targetSpec = targets[slug]

    let targetStr = 'N/A'
    let actionStr = 'OK'

    if (targetSpec) {
      if (targetSpec.status === 'deepen-only') {
        targetStr = 'Deepen only'
        actionStr = '⏸️ Halt additions; deepen landmarks'
      } else if (targetSpec.target) {
        const tE = targetSpec.target.easy ?? 0
        const tM = targetSpec.target.medium ?? 0
        const tH = targetSpec.target.hard ?? 0
        targetStr = `${tE}/${tM}/${tH}`

        const needed: string[] = []
        if (stats.easy < tE) needed.push(`+${tE - stats.easy} Easy`)
        if (stats.medium < tM) needed.push(`+${tM - stats.medium} Medium`)
        if (stats.hard < tH) needed.push(`+${tH - stats.hard} Hard`)

        if (needed.length > 0) {
          actionStr = `🎯 Need: ${needed.join(', ')}`
        } else {
          actionStr = '✅ Target met'
        }
      }
    }

    console.log(`| **${pName}** (\`${slug}\`) | ${currentStr} (${stats.count}) | ${targetStr} | ${actionStr} |`)
  }
}

generateReport()
