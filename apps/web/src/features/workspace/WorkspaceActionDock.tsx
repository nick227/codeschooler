import { Link } from 'react-router-dom'
import type { WorkspaceViewState } from './workspace.types'

export function WorkspaceActionDock({ state, freshRun, allPassed, runRequired, continueTo, onRun, onCheck }: {
  state: WorkspaceViewState
  freshRun: boolean
  allPassed: boolean
  runRequired: boolean
  continueTo: string
  onRun: () => void
  onCheck: () => void
}) {
  const running = state.phase === 'running'
  const checking = state.phase === 'checking'
  const isComplete = state.phase === 'complete'
  const checkPrimary = allPassed && (!runRequired || freshRun)

  return (
    <div className="action-dock" aria-label="Workspace actions">
      <div className="recovery-actions">
        <span key={state.saveStatus} className={`save-state ${state.saveStatus === 'error' ? 'save-error' : ''} ${state.saveStatus !== 'idle' ? 'save-pulse' : ''}`} aria-live="polite">
          {state.saveStatus === 'saved' ? 'Saved on this device' : state.saveStatus === 'error' ? 'Couldn’t save locally' : ''}
        </span>
      </div>
      <div className="primary-actions">
        <button type="button" className={`action-btn ${checkPrimary ? 'secondary-button' : 'primary-button'}`} onClick={onRun} disabled={running || checking || isComplete} title="Run (Ctrl or Command + Enter)">
          <span aria-hidden="true">▶</span> {running ? 'Running…' : 'Run'}
        </button>
        <button type="button" className={`action-btn ${checkPrimary ? 'primary-button' : 'secondary-button'}`} onClick={onCheck} disabled={running || checking || isComplete} title="Check (Ctrl or Command + Shift + Enter)">
          {checking ? 'Checking…' : 'Check'}
        </button>
        {isComplete ? (
          <Link
            id="next-challenge-btn"
            className="primary-button next-btn action-btn"
            to={continueTo}
            aria-label="Continue to next lesson"
          >
            Next <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <button
            id="next-challenge-btn"
            type="button"
            className="primary-button next-btn action-btn"
            disabled
            title="Complete this challenge to continue"
            aria-label="Next challenge — complete this challenge first"
          >
            Next <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  )
}
