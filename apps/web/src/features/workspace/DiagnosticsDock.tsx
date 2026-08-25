import { useEffect, useRef, useState } from 'react'
import type { CheckOutcome } from '@code-trainer/evaluators'
import type { PublicChallenge, WorkspaceViewState } from './workspace.types'

type DockTab = 'console' | 'checks' | 'trace'

function fallbackCheckLabel(check: PublicChallenge['checks'][number]): string {
  switch (check.type) {
    case 'variableExists': return `Create ${check.name}`
    case 'variableEquals': return `Give ${check.name} the value ${String(check.value)}`
    case 'outputEquals': return 'Print the expected output'
    case 'outputContains': return `Include "${check.value}" in the output`
    case 'functionExists': return `Create ${check.name}`
    case 'functionReturns': return 'Return the expected value'
  }
}

export function DiagnosticsDock({ challenge, state, confirmed }: {
  challenge: PublicChallenge
  state: WorkspaceViewState
  confirmed: boolean
}) {
  const nameCheck = challenge.checks.find((check) => check.type === 'variableExists')
  const valueCheck = challenge.checks.find((check) => check.type === 'variableEquals')
  const traceAvailable = Boolean(nameCheck && valueCheck)
  const tabs: DockTab[] = traceAvailable ? ['console', 'checks', 'trace'] : ['console', 'checks']

  const [activeTab, setActiveTab] = useState<DockTab>('checks')
  const prevPhase = useRef(state.phase)
  const prevRuntimeStatus = useRef(state.runtime.status)

  useEffect(() => {
    if (prevRuntimeStatus.current !== state.runtime.status && (state.runtime.status === 'success' || state.runtime.status === 'error')) {
      setActiveTab('console')
    } else if (prevPhase.current === 'checking' && state.phase !== 'checking') {
      setActiveTab('checks')
    }
    prevPhase.current = state.phase
    prevRuntimeStatus.current = state.runtime.status
  }, [state.phase, state.runtime.status])

  const tabLabel: Record<DockTab, string> = { console: 'Console', checks: 'Checks', trace: 'Trace' }
  const currentTab = tabs.includes(activeTab) ? activeTab : 'console'

  return (
    <section className="diagnostics-dock" aria-label="Program diagnostics">
      <div className="dock-tabs" role="tablist" aria-label="Diagnostics view">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={currentTab === tab}
            className={`dock-tab ${currentTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabel[tab]}
          </button>
        ))}
        <span className="dock-status" aria-hidden="true">
          {state.runtime.status === 'running'
            ? 'Running…'
            : state.runtime.status === 'success'
              ? `${Math.round(state.runtime.result?.durationMs ?? 0)} ms`
              : state.runtime.status === 'error'
                ? 'Error'
                : ''}
        </span>
      </div>

      <div className="dock-panel" role="tabpanel">
        {currentTab === 'console' && <ConsolePanel runtime={state.runtime} />}
        {currentTab === 'checks' && <ChecksPanel challenge={challenge} outcomes={state.outcomes} />}
        {currentTab === 'trace' && traceAvailable && (
          <TracePanel nameCheck={nameCheck!} valueCheck={valueCheck!} outcomes={state.outcomes} confirmed={confirmed} />
        )}
      </div>
    </section>
  )
}

function ConsolePanel({ runtime }: { runtime: WorkspaceViewState['runtime'] }) {
  if (!runtime.visible || runtime.status === 'idle') {
    return <div className="dock-empty" role="status">Click <strong>Run</strong> to execute your code and inspect console output.</div>
  }
  if (runtime.status === 'running') return <div className="dock-empty" role="status">Running your code safely…</div>
  if (runtime.status === 'error') {
    return (
      <div className="dock-error" role="alert">
        <strong>This program couldn’t finish.</strong>
        <span>{runtime.result?.error?.message}</span>
      </div>
    )
  }
  if (runtime.result?.logs.length) return <pre className="dock-console-output">{runtime.result.logs.join('\n')}</pre>
  return <div className="dock-empty">The program ran successfully without printing output.</div>
}

function ChecksPanel({ challenge, outcomes }: { challenge: PublicChallenge; outcomes: CheckOutcome[] }) {
  if (challenge.checks.length === 0) return <div className="dock-empty">This challenge has no automated checks.</div>
  return (
    <ul className="dock-check-list">
      {challenge.checks.map((check, index) => {
        const outcome = outcomes[index]
        const passed = outcome?.passed ?? false
        return (
          <li key={`${check.type}-${index}`} className={passed ? 'is-passed' : ''}>
            <span aria-hidden="true">{passed ? '✓' : '○'}</span>
            {outcome?.label ?? fallbackCheckLabel(check)}
          </li>
        )
      })}
    </ul>
  )
}

function TracePanel({ nameCheck, valueCheck, outcomes, confirmed }: {
  nameCheck: PublicChallenge['checks'][number]
  valueCheck: PublicChallenge['checks'][number]
  outcomes: CheckOutcome[]
  confirmed: boolean
}) {
  const valuePassed = outcomes.find((outcome) => outcome.check.type === 'variableEquals')?.passed
  if (nameCheck.type !== 'variableExists' || valueCheck.type !== 'variableEquals' || !valuePassed) {
    return <div className="dock-empty">Program state will appear here once this value is ready.</div>
  }
  return (
    <div
      className={`program-trace ${confirmed ? 'is-confirmed' : ''}`}
      aria-label={`${nameCheck.name} holds the value ${String(valueCheck.value)}${confirmed ? ', confirmed by running the program' : ''}`}
    >
      <code>{nameCheck.name}</code><i /><small>holds</small><i /><strong>{String(valueCheck.value)}</strong>
      <span className="trace-status">{confirmed ? 'Run confirmed' : 'Ready to run'}</span>
    </div>
  )
}
