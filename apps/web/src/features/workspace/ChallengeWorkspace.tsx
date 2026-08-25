import { useRef } from 'react'
import { ChallengeContext } from './ChallengeContext'
import { CompletionCard } from './CompletionCard'
import { DiagnosticsDock } from './DiagnosticsDock'
import { EditorSurface, type EditorHandle } from './EditorSurface'
import { HintLadder } from './HintLadder'
import { MobileCodingRow } from './MobileCodingRow'
import { WorkspaceActionDock } from './WorkspaceActionDock'
import { useWorkspaceController } from './useWorkspaceController'
import type { PublicChallenge } from './workspace.types'

export function ChallengeWorkspace({ challenge, trackId, sectionId, sectionTitle, position, continueTo, returnToOverride }: {
  challenge: PublicChallenge
  trackId: string
  sectionId: string
  sectionTitle?: string
  position?: string
  continueTo?: string
  returnToOverride?: string
}) {
  const editor = useRef<EditorHandle>(null)
  const controller = useWorkspaceController(challenge)
  const { state } = controller
  const returnTo = returnToOverride ?? `/learn/${trackId}/${sectionId}`

  const reveal = () => {
    if (window.confirm('Showing the answer ends eligibility for a no-solution award on this attempt. You can still complete the challenge.')) void controller.requestHint(true)
  }

  const showDiagnosticBanner = state.phase === 'feedback' && state.teaching?.kind === 'diagnostic'

  return (
    <div className="workspace-page">
      {state.phase === 'complete' && state.completion ? (
        <main className="completion-stage"><CompletionCard challenge={challenge} completion={state.completion} continueTo={continueTo ?? returnTo} returnTo={returnTo} /></main>
      ) : (
        <main className="workspace-layout">
          <aside className="teaching-hud" aria-label="Lesson guide">
            <ChallengeContext challenge={challenge} state={state} returnTo={returnTo} sectionTitle={sectionTitle} position={position} />
            <HintLadder state={state} onHint={() => void controller.requestHint()} onReveal={reveal} />
          </aside>
          <section className="code-column" aria-label="Coding workspace">
            <div className="mobile-goal"><span className="hud-label">Objective</span><p>{challenge.instruction}</p></div>
            <div className="file-tabbar"><span className="file-tab"><i aria-hidden="true">JS</i> main.js</span><span className="editor-language">JavaScript</span></div>
            <div className="editor-frame">
              {showDiagnosticBanner && (
                <div className="editor-diagnostic-banner" role="status" aria-live="polite">{state.teaching!.message}</div>
              )}
              <EditorSurface ref={editor} source={state.source} diagnostic={state.observation.state === 'invalid' ? state.observation.diagnostic : undefined} onChange={controller.changeSource} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
            </div>
            <DiagnosticsDock challenge={challenge} state={state} confirmed={controller.freshRun} />
            <MobileCodingRow onInsert={(value) => editor.current?.insert(value)} />
            {challenge.evidence?.role === 'transfer' && <div className="transfer-exit"><button className="text-button danger-text" onClick={() => { if (window.confirm('End this transfer attempt and record that you did not complete it?')) controller.endTransferAttempt() }}>I'm stuck · end attempt</button></div>}
            <WorkspaceActionDock state={state} freshRun={controller.freshRun} allPassed={controller.allPassed} runRequired={controller.runRequired} continueTo={continueTo ?? returnTo} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
          </section>
        </main>
      )}
    </div>
  )
}
