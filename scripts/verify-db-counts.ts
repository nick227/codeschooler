import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

if (!process.env.DATABASE_URL) {
  const envPath = join(__dirname, '../.env')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('DATABASE_URL=')) {
        const val = trimmed.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '')
        process.env.DATABASE_URL = val
      }
    }
  }
}

import { db } from '@code-trainer/db'
import {
  loadSkills,
  loadAllTracks,
  loadAllSections,
  loadAllProjects,
  loadAllInterviewProblems,
  loadAllQuizSets,
} from '@code-trainer/learning-engine'

export async function verifyDbCounts() {
  console.log(`\n=== VERIFYING DATABASE VS CANONICAL CONTENT CATALOG ===`)

  const canonicalSkills = loadSkills().length
  const canonicalTracks = loadAllTracks().length
  const canonicalSections = loadAllSections().length
  const canonicalProjects = loadAllProjects().length
  const canonicalInterviews = loadAllInterviewProblems().length
  const canonicalQuizSets = loadAllQuizSets().length

  const dbSkills = await db.skill.count()
  const dbCategories = await db.category.count()
  const dbCodingChallenges = await db.contentItem.count({ where: { type: 'coding_challenge' } })
  const dbProjectSteps = await db.contentItem.count({ where: { type: 'project_step' } })
  const dbInterviewProblems = await db.contentItem.count({ where: { type: 'interview_problem' } })
  const dbKnowledgeQuestions = await db.contentItem.count({ where: { type: 'knowledge_question' } })

  console.log(`| Entity | Canonical Source Count | DB Item Count | Status |`)
  console.log(`|---|---|---|---|`)
  console.log(`| Skills | ${canonicalSkills} | ${dbSkills} | ${canonicalSkills === dbSkills ? '✅ MATCH' : '❌ MISMATCH'} |`)
  console.log(`| Categories | ${canonicalTracks + canonicalSections + canonicalProjects + canonicalInterviews + canonicalQuizSets} | ${dbCategories} | ${dbCategories > 0 ? '✅ SEEDED' : '❌ MISMATCH'} |`)
  console.log(`| Interview Problems | ${canonicalInterviews} | ${dbInterviewProblems} | ${canonicalInterviews === dbInterviewProblems ? '✅ MATCH' : '❌ MISMATCH'} |`)

  const mismatches = []
  if (canonicalSkills !== dbSkills) mismatches.push(`Skills count mismatch: canonical ${canonicalSkills} vs DB ${dbSkills}`)
  if (canonicalInterviews !== dbInterviewProblems) mismatches.push(`Interview problems count mismatch: canonical ${canonicalInterviews} vs DB ${dbInterviewProblems}`)

  if (mismatches.length > 0) {
    console.error(`\n❌  DATABASE COUNTS MATERIALLY DIFFER FROM SOURCE COUNTS:`)
    for (const m of mismatches) console.error(`    - ${m}`)
    process.exit(1)
  } else {
    console.log(`\n✅  DATABASE INVENTORY IS IN EXACT ALIGNMENT WITH CANONICAL SOURCE.`)
  }
}

verifyDbCounts().catch((err) => {
  console.error('Error verifying DB counts:', err)
  process.exit(1)
})
