import { Link } from 'react-router-dom'
import type { PublicChallenge, WorkspaceViewState } from './workspace.types'

export function CompletionCard({ challenge, completion, continueTo, returnTo }: {
  challenge: PublicChallenge
  completion: NonNullable<WorkspaceViewState['completion']>
  continueTo: string
  returnTo?: string
}) {
  return (
    <div className="completion-card" role="status">
      <div className="completion-seal" aria-hidden="true">✓</div>
      <p className="eyebrow">Challenge complete</p>
      <h2>You completed {challenge.title}.</h2>
      <p>You wrote real JavaScript and checked it against the goal.</p>
      <div className="xp-award">
        <strong>{completion.xpAwarded ? `+${completion.xpAwarded}` : '✓'}</strong>
        <span>{completion.xpAwarded ? 'XP earned' : 'Already completed'}</span>
      </div>
      <div className="completion-actions">
        <Link className="primary-button" to={continueTo}>
          Continue learning <span aria-hidden="true">→</span>
        </Link>
        {returnTo && returnTo !== continueTo && (
          <Link className="secondary-button" to={returnTo}>
            Return to catalog
          </Link>
        )}
      </div>
    </div>
  )
}
