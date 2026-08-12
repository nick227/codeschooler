import type { CheckOutcome } from '@code-trainer/evaluators'
import type { PublicChallenge, WorkspaceViewState } from './workspace.types'

function labelForCheck(check: PublicChallenge['checks'][number]): string {
  switch (check.type) {
    case 'variableExists': return `Create ${check.name}`
    case 'variableEquals': return `Give ${check.name} the value ${String(check.value)}`
    case 'outputEquals': return 'Print the expected output'
    case 'outputContains': return `Include “${check.value}” in the output`
    case 'functionExists': return `Create ${check.name}`
    case 'functionReturns': return 'Return the expected value'
  }
}

export function TeachingHud({ challenge, state, onHint, onReveal }: {
  challenge: PublicChallenge
  state: WorkspaceViewState
  onHint: () => void
  onReveal: () => void
}) {
  const outcomeFor = (index: number): CheckOutcome | undefined => state.outcomes[index]
  return (
    <aside className="teaching-hud" aria-label="Lesson guide">
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
      <section className="hud-section hud-guide">
        <span className="hud-label">Guide</span>
        <div className={`guide-message ${state.teaching?.kind ?? 'quiet'}`} aria-live="polite" aria-atomic="true">
          {state.phase === 'observing' ? <><span className="thinking-dot" />Reading your program…</> : state.teaching?.message ?? 'Take your time. I’ll step in when there’s something useful to say.'}
        </div>
        {state.phase !== 'complete' && (
          <div className="hint-actions">
            <button type="button" className="text-button" onClick={onHint}>{state.hintLevel ? 'Another hint' : 'Give me a hint'}</button>
            {state.hintLevel >= 3 && <button type="button" className="text-button danger-text" onClick={onReveal}>Show the answer</button>}
          </div>
        )}
      </section>
    </aside>
  )
}
