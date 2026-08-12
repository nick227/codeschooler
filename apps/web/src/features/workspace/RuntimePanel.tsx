import type { PublicChallenge, WorkspaceViewState } from './workspace.types'

export function RuntimePanel({ challenge: _challenge, runtime }: { challenge: PublicChallenge; runtime: WorkspaceViewState['runtime'] }) {
  return (
    <section className="runtime-panel" aria-label="Program output">
      <div className="runtime-heading">
        <span>Runtime Console</span>
        <small>
          {runtime.status === 'running'
            ? 'Running…'
            : runtime.status === 'success'
              ? `${Math.round(runtime.result?.durationMs ?? 0)} ms`
              : runtime.status === 'error'
                ? 'Error'
                : 'Ready'}
        </small>
      </div>
      {(!runtime.visible || runtime.status === 'idle') && (
        <div className="runtime-empty" role="status">
          Click <strong>Run</strong> to execute your code and inspect console output.
        </div>
      )}
      {runtime.status === 'running' && <div className="runtime-empty" role="status">Running your code safely…</div>}
      {runtime.status === 'error' && <div className="runtime-error" role="alert"><strong>This program couldn’t finish.</strong><span>{runtime.result?.error?.message}</span></div>}
      {runtime.status === 'success' && (
        <div className="runtime-content">
          {runtime.result?.logs.length ? (
            <div><span className="runtime-label">Output</span><pre>{runtime.result.logs.join('\n')}</pre></div>
          ) : (
            <div className="runtime-empty">The program ran successfully without printing output.</div>
          )}
        </div>
      )}
    </section>
  )
}
