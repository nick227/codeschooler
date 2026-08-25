import { Link } from 'react-router-dom'
import type { PublicChallenge, WorkspaceViewState } from './workspace.types'
import { ConceptDisclosure } from './ConceptDisclosure'

export function ChallengeContext({ challenge, state, returnTo, sectionTitle, position }: {
  challenge: PublicChallenge
  state: WorkspaceViewState
  returnTo: string
  sectionTitle?: string
  position?: string
}) {
  const guidanceLabel = challenge.guidance === 'independent' ? 'Independent' : challenge.guidance === 'supported' ? 'Supported' : 'Guided'
  const backLabel = sectionTitle
    ? (sectionTitle.startsWith('Return') ? sectionTitle : `Return to ${sectionTitle}`)
    : 'Return to Catalog'

  const total = challenge.checks.length
  const passedCount = state.outcomes.filter((outcome) => outcome.passed).length

  return (
    <>
      <section className="hud-section hud-nav">
        <Link className="hud-back-link" to={returnTo}>
          <span className="hud-back-arrow" aria-hidden="true">←</span>
          <span className="hud-back-label">{backLabel}</span>
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
        <span className="hud-label">Objective</span>
        <p>{challenge.instruction}</p>
      </section>

      {total > 0 && (
        <section className="hud-section hud-progress" aria-label={`Progress: ${passedCount} of ${total} complete`}>
          <span className="hud-label">Progress</span>
          <div className="progress-strip">
            <div className="progress-dots" role="presentation">
              {challenge.checks.map((_, index) => (
                <span key={index} className={`progress-dot ${index < passedCount ? 'is-passed' : ''}`} aria-hidden="true" />
              ))}
            </div>
            <span className="progress-fraction">{passedCount} of {total} complete</span>
          </div>
        </section>
      )}

      <section className="hud-section hud-concept">
        <ConceptDisclosure challenge={challenge} />
      </section>
    </>
  )
}
