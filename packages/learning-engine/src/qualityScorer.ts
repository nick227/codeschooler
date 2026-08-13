import type { InterviewProblem } from '@code-trainer/content-schema'

export interface QualityIssue {
  code: 'duplicate_similarity' | 'hint_quality' | 'fixture_strength' | 'progression_mismatch'
  severity: 'error' | 'warning'
  detail: string
}

export interface QualityScoreResult {
  score: number // 0 to 100
  passed: boolean
  needsHumanReview: boolean
  issues: QualityIssue[]
  reviewFlags: string[]
}

function tokenSet(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
  return new Set(words)
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Evaluates an interview problem against strict quality, similarity, hint,
 * and fixture strength rules before acceptance into the curriculum.
 */
export function scoreInterviewProblem(
  problem: InterviewProblem,
  existingProblems: InterviewProblem[] = []
): QualityScoreResult {
  const issues: QualityIssue[] = []
  const reviewFlags: string[] = []
  let score = 100

  // 1. Duplicate Similarity Check against existing problems
  const titleTokens = tokenSet(problem.title)
  const instructionTokens = tokenSet(problem.challenge.instruction)

  for (const existing of existingProblems) {
    if (existing.id === problem.id) continue

    const existingTitleTokens = tokenSet(existing.title)
    const existingInstructionTokens = tokenSet(existing.challenge.instruction)

    const titleSim = jaccardSimilarity(titleTokens, existingTitleTokens)
    const instructionSim = jaccardSimilarity(instructionTokens, existingInstructionTokens)

    if (titleSim > 0.85 || instructionSim > 0.8) {
      score -= 40
      issues.push({
        code: 'duplicate_similarity',
        severity: 'error',
        detail: `Problem is too similar to existing problem "${existing.title}" (${existing.id}). Title similarity: ${(titleSim * 100).toFixed(0)}%, Instruction similarity: ${(instructionSim * 100).toFixed(0)}%`,
      })
      reviewFlags.push(`High similarity to "${existing.title}"`)
    } else if (titleSim > 0.6 || instructionSim > 0.6) {
      score -= 15
      issues.push({
        code: 'duplicate_similarity',
        severity: 'warning',
        detail: `Problem has moderate text similarity to "${existing.title}".`,
      })
      reviewFlags.push(`Moderate similarity to "${existing.title}"`)
    }
  }

  // 2. Hint Quality Checks
  const hints = problem.challenge.hints || []
  if (hints.length < 4) {
    score -= 20
    issues.push({
      code: 'hint_quality',
      severity: 'error',
      detail: `Challenge has ${hints.length} hints (minimum 4 required for hint ladder).`,
    })
    reviewFlags.push('Incomplete hint ladder (< 4 levels)')
  } else {
    // Level 4 hint must contain actionable code
    const level4 = hints.find((h) => h.level === 4)
    if (level4 && !level4.message.includes('function') && !level4.message.includes('return') && !level4.message.includes('const') && !level4.message.includes('let')) {
      score -= 10
      issues.push({
        code: 'hint_quality',
        severity: 'warning',
        detail: 'Level 4 hint should contain reference code syntax or return statement.',
      })
      reviewFlags.push('Level 4 hint lacks explicit solution code')
    }
  }

  // 3. Fixture Strength Checks
  const authoring = problem.challenge.authoring
  if (!authoring) {
    score -= 30
    issues.push({
      code: 'fixture_strength',
      severity: 'error',
      detail: 'Missing authoring block (reference, accepted, and rejected solutions required).',
    })
  } else {
    const acceptedCount = authoring.acceptedSolutions?.length ?? 0
    const rejectedCount = authoring.rejectedSolutions?.length ?? 0

    if (acceptedCount === 0) {
      score -= 20
      issues.push({
        code: 'fixture_strength',
        severity: 'error',
        detail: 'Must provide at least 1 accepted solution fixture.',
      })
    }
    if (rejectedCount === 0) {
      score -= 20
      issues.push({
        code: 'fixture_strength',
        severity: 'error',
        detail: 'Must provide at least 1 rejected solution fixture (anti-pattern test case).',
      })
    }
    if (acceptedCount === 1 && rejectedCount === 1) {
      reviewFlags.push('Single accepted/rejected fixture pair')
    }
  }

  // 4. Progression Role Alignment
  if (problem.progression === 'intro') {
    if (problem.difficulty === 'hard') {
      score -= 30
      issues.push({
        code: 'progression_mismatch',
        severity: 'error',
        detail: 'Intro progression role cannot be paired with Hard difficulty.',
      })
    }
    if (problem.challenge.difficultyScore && problem.challenge.difficultyScore > 40) {
      score -= 15
      issues.push({
        code: 'progression_mismatch',
        severity: 'warning',
        detail: `Intro problem has high difficultyScore (${problem.challenge.difficultyScore} > 40).`,
      })
      reviewFlags.push('High difficulty score for intro role')
    }
  } else if (problem.progression === 'advanced') {
    if (problem.difficulty === 'easy') {
      score -= 30
      issues.push({
        code: 'progression_mismatch',
        severity: 'error',
        detail: 'Advanced progression role cannot be paired with Easy difficulty.',
      })
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error')
  const finalScore = Math.max(0, score)
  const needsHumanReview = hasErrors || reviewFlags.length > 0 || finalScore < 85

  return {
    score: finalScore,
    passed: !hasErrors && finalScore >= 70,
    needsHumanReview,
    issues,
    reviewFlags,
  }
}
