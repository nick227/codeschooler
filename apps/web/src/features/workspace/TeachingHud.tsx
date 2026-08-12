import { Link } from 'react-router-dom'
import type { CheckOutcome } from '@code-trainer/evaluators'
import type { PublicChallenge, WorkspaceViewState } from './workspace.types'

function labelForCheck(check: PublicChallenge['checks'][number]): string {
  switch (check.type) {
    case 'variableExists': return `Create ${check.name}`
    case 'variableEquals': return `Give ${check.name} the value ${String(check.value)}`
    case 'outputEquals': return 'Print the expected output'
    case 'outputContains': return `Include "${check.value}" in the output`
    case 'functionExists': return `Create ${check.name}`
    case 'functionReturns': return 'Return the expected value'
  }
}

function lessonContentForChallenge(challenge: PublicChallenge): { topic: string; summary: string; keyTakeaway: string } {
  const skills = challenge.skills ?? []
  const title = challenge.title.toLowerCase()
  const instruction = challenge.instruction.toLowerCase()

  if (title.includes('variable') || instruction.includes('variable') || skills.includes('variables')) {
    return {
      topic: 'Variables & Value Binding',
      summary: 'In JavaScript, variables store data under a descriptive name so you can reuse and reference values throughout your program.',
      keyTakeaway: 'Declarations bind values to names. Clear variable naming makes your code self-documenting.',
    }
  }

  if (title.includes('function') || instruction.includes('function') || skills.includes('functions')) {
    return {
      topic: 'Functions & Reusable Logic',
      summary: 'Functions group code into reusable blocks that accept arguments, execute steps, and return computed results.',
      keyTakeaway: 'Functions isolate logic into clean, modular building blocks that can be tested independently.',
    }
  }

  if (title.includes('print') || title.includes('output') || instruction.includes('console')) {
    return {
      topic: 'Output & Program Observation',
      summary: "Outputting values lets you observe your program's execution state in real-time.",
      keyTakeaway: 'Observing exact outputs verifies your calculations match expected results.',
    }
  }

  return {
    topic: 'JavaScript Fundamentals',
    summary: `This challenge reinforces core skills in ${challenge.title} through active coding and instant validation.`,
    keyTakeaway: 'Writing real syntax directly in the editor builds muscular memory and problem-solving confidence.',
  }
}

export function TeachingHud({ challenge, state, returnTo, sectionTitle, position, onHint, onReveal }: {
  challenge: PublicChallenge
  state: WorkspaceViewState
  returnTo: string
  sectionTitle?: string
  position?: string
  onHint: () => void
  onReveal: () => void
}) {
  const outcomeFor = (index: number): CheckOutcome | undefined => state.outcomes[index]
  const lesson = lessonContentForChallenge(challenge)
  const guidanceLabel = challenge.guidance === 'assessment' ? 'Assessment' : challenge.guidance === 'independent' ? 'Independent' : 'Guided'

  return (
    <aside className="teaching-hud" aria-label="Lesson guide">

      {/* Back navigation + challenge context */}
      <section className="hud-section hud-nav">
        <Link className="hud-back-link" to={returnTo}>
          <span className="hud-back-arrow" aria-hidden="true">←</span>
          <span className="hud-back-label">{sectionTitle ?? 'Back to section'}</span>
        </Link>
        <h2 className="hud-challenge-title">{challenge.title}</h2>
        <div className="hud-challenge-meta">
          <span className="hud-meta-tag">{challenge.language === 'javascript' ? 'JavaScript' : challenge.language}</span>
          <span className="hud-meta-tag">{guidanceLabel}</span>
          <span className="hud-meta-tag hud-meta-xp">{challenge.reward.xp} XP</span>
          {position && <span className="hud-meta-position">{position}</span>}
        </div>
      </section>

      <section className="hud-section hud-goal">
        <span className="hud-label">Goal</span>
        <h1>{challenge.instruction}</h1>
      </section>

      <section className="hud-section">
        <span className="hud-label">Progress</span>
        <ul className="check-list">
          {challenge.checks.map((check, index) => {
            const passed = outcomeFor(index)?.passed ?? false
            return <li className={passed ? 'is-passed' : ''} key={`${check.type}-${index}`}><span aria-hidden="true">{passed ? '✓' : '○'}</span>{labelForCheck(check)}</li>
          })}
        </ul>
      </section>

      {/* Static Lesson Content Section */}
      <section className="hud-section hud-concept">
        <span className="hud-label">What You're Learning</span>
        <div className="concept-box">
          <strong className="concept-topic">{lesson.topic}</strong>
          <p className="concept-summary">{lesson.summary}</p>
          <div className="concept-takeaway">
            <span className="takeaway-label">Key Takeaway</span>
            <p>{lesson.keyTakeaway}</p>
          </div>
        </div>
      </section>

      {/* Hints Section: Hint output renders under Show Hint link */}
      {state.phase !== 'complete' && (
        <section className="hud-section hud-hints">
          <span className="hud-label">Assistance</span>
          <div className="hint-actions">
            <button type="button" className="text-button" onClick={onHint}>
              {state.hintLevel ? 'Show another hint' : 'Show hint'}
            </button>
            {state.hintLevel >= 3 && (
              <button type="button" className="text-button danger-text" onClick={onReveal}>
                Show the answer
              </button>
            )}
          </div>

          {state.teaching?.message && (state.teaching?.kind === 'hint' || state.hintLevel > 0) && (
            <div className="hint-output-box" aria-live="polite">
              <span className="hint-level-tag">Hint {state.hintLevel || 1}</span>
              <p>{state.teaching.message}</p>
            </div>
          )}
        </section>
      )}
    </aside>
  )
}
