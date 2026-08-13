import { useRef } from 'react'
import { CompletionCard } from './CompletionCard'
import { EditorSurface, type EditorHandle } from './EditorSurface'
import { MobileCodingRow } from './MobileCodingRow'
import { ProgramTrace } from './ProgramTrace'
import { RuntimePanel } from './RuntimePanel'
import { TeachingHud } from './TeachingHud'
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

  return (
    <div className="workspace-page">
      {state.phase === 'complete' && state.completion ? (
        <main className="completion-stage"><CompletionCard challenge={challenge} completion={state.completion} continueTo={continueTo ?? returnTo} returnTo={returnTo} /></main>
      ) : (
        <main className="workspace-layout">
          <TeachingHud
            challenge={challenge}
            state={state}
            returnTo={returnTo}
            sectionTitle={sectionTitle}
            position={position}
            onHint={() => void controller.requestHint()}
            onReveal={reveal}
          />
          <section className="code-column" aria-label="Coding workspace">
            <div className="mobile-goal"><span className="hud-label">Goal</span><strong>{challenge.instruction}</strong></div>
            <div className="file-tabbar"><span className="file-tab"><i aria-hidden="true">JS</i> main.js</span><span className="editor-language">JavaScript</span></div>
            <div className="editor-frame">
              <EditorSurface ref={editor} source={state.source} diagnostic={state.observation.state === 'invalid' ? state.observation.diagnostic : undefined} onChange={controller.changeSource} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
            </div>
            <ProgramTrace challenge={challenge} outcomes={state.outcomes} confirmed={controller.freshRun} />
            <MobileCodingRow onInsert={(value) => editor.current?.insert(value)} />
            <RuntimePanel challenge={challenge} runtime={state.runtime} />
            {challenge.evidence?.role === 'transfer' && <div className="transfer-exit"><button className="text-button danger-text" onClick={() => { if (window.confirm('End this transfer attempt and record that you did not complete it?')) controller.endTransferAttempt() }}>I'm stuck · end attempt</button></div>}
            <WorkspaceActionDock state={state} freshRun={controller.freshRun} allPassed={controller.allPassed} runRequired={controller.runRequired} continueTo={continueTo ?? returnTo} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
          </section>
        </main>
      )}
    </div>
  )
}
