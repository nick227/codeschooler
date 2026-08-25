import type { WorkspaceViewState } from './workspace.types'

interface LadderRung {
  level: 1 | 2 | 3 | 4
  name: string
  nextLabel: string
}

const RUNGS: LadderRung[] = [
  { level: 1, name: 'Describe', nextLabel: 'Get a nudge about what’s happening' },
  { level: 2, name: 'Explain', nextLabel: 'Get the concept explained' },
  { level: 3, name: 'Structure', nextLabel: 'Get a structural nudge' },
  { level: 4, name: 'Reveal', nextLabel: 'Show the answer' },
]

export function HintLadder({ state, onHint, onReveal }: {
  state: WorkspaceViewState
  onHint: () => void
  onReveal: () => void
}) {
  if (state.phase === 'complete') return null

  const hintLevel = state.hintLevel
  const canReveal = hintLevel >= 3
  const nextRung = hintLevel < 3 ? RUNGS[hintLevel] : undefined
  const showMessage = Boolean(state.teaching?.message) && (state.teaching?.kind === 'hint' || hintLevel > 0)

  return (
    <section className="hud-section hud-hints">
      <span className="hud-label">Assistance</span>

      <ol className="hint-ladder" aria-label="Hint ladder, four levels from a nudge to the full answer">
        {RUNGS.map((rung) => {
          const status = rung.level < hintLevel ? 'done' : rung.level === hintLevel ? 'current' : 'upcoming'
          return (
            <li key={rung.level} className={`hint-ladder-step is-${status}`}>
              <span className="hint-ladder-pip" aria-hidden="true">{status === 'done' ? '✓' : rung.level}</span>
              <span className="hint-ladder-name">{rung.name}</span>
            </li>
          )
        })}
      </ol>

      <div className="hint-actions">
        {hintLevel < 3 && (
          <button type="button" className="text-button" onClick={onHint}>
            {nextRung ? nextRung.nextLabel : 'Show hint'}
          </button>
        )}
        {hintLevel >= 3 && !canReveal && (
          <button type="button" className="text-button" onClick={onHint}>Show another hint</button>
        )}
        {canReveal && (
          <button type="button" className="text-button danger-text" onClick={onReveal}>
            Show the answer
          </button>
        )}
      </div>

      {showMessage && (
        <div className="hint-output-box" aria-live="polite">
          <span className="hint-level-tag">Hint {hintLevel || 1} · {RUNGS.find((rung) => rung.level === Math.max(1, Math.min(4, hintLevel)))?.name}</span>
          <p>{state.teaching!.message}</p>
        </div>
      )}
    </section>
  )
}
