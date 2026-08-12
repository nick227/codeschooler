import type { WorkspaceViewState } from './workspace.types'

export function WorkspaceActionDock({ state, freshRun, allPassed, runRequired, onUndo, onReset, onRun, onCheck }: {
  state: WorkspaceViewState
  freshRun: boolean
  allPassed: boolean
  runRequired: boolean
  onUndo: () => void
  onReset: () => void
  onRun: () => void
  onCheck: () => void
}) {
  const running = state.phase === 'running'
  const checking = state.phase === 'checking'
  const checkPrimary = allPassed && (!runRequired || freshRun)
  return (
    <div className="action-dock" aria-label="Workspace actions">
      <div className="recovery-actions">
        <button type="button" className="icon-text-button" onClick={onUndo}><span aria-hidden="true">↶</span> Undo</button>
        <button type="button" className="icon-text-button" onClick={onReset}>Reset step</button>
        <span className={`save-state ${state.saveStatus === 'error' ? 'save-error' : ''}`} aria-live="polite">
          {state.saveStatus === 'saved' ? 'Saved on this device' : state.saveStatus === 'error' ? 'Couldn’t save locally' : ''}
        </span>
      </div>
      <div className="primary-actions">
        <button type="button" className={checkPrimary ? 'secondary-button' : 'primary-button'} onClick={onRun} disabled={running || checking} title="Run (Ctrl or Command + Enter)">
          <span aria-hidden="true">▶</span> {running ? 'Running…' : 'Run'}
        </button>
        <button type="button" className={checkPrimary ? 'primary-button' : 'secondary-button'} onClick={onCheck} disabled={running || checking} title="Check (Ctrl or Command + Shift + Enter)">
          {checking ? 'Checking…' : 'Check'}
        </button>
      </div>
    </div>
  )
}
