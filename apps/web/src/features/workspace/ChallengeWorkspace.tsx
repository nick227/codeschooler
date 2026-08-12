import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
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

  const reset = () => {
    if (state.source === challenge.starterCode || window.confirm('Reset this step to its starting code? Your current draft can still be recovered with Undo until you leave.')) controller.reset()
  }
  const reveal = () => {
    if (window.confirm('Showing the answer ends eligibility for a no-solution award on this attempt. You can still complete the challenge.')) void controller.requestHint(true)
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <Brand />
        <Link className="workspace-context" to={returnTo}><span aria-hidden="true">←</span><span><small>{challenge.language === 'javascript' ? 'JavaScript' : challenge.language} · {sectionTitle ?? 'Learn'}</small><strong>{challenge.title}</strong></span></Link>
        <div className="workspace-meta"><span>{position}</span><span className="level-chip">{challenge.guidance === 'assessment' ? 'Assessment' : challenge.guidance === 'independent' ? 'Independent' : 'Guided'}</span><span>{challenge.reward.xp} XP</span></div>
      </header>
      {state.phase === 'complete' && state.completion ? (
        <main className="completion-stage"><CompletionCard challenge={challenge} completion={state.completion} continueTo={continueTo ?? returnTo} /></main>
      ) : (
        <main className="workspace-layout">
          <section className="code-column" aria-label="Coding workspace">
            <div className="mobile-goal"><span className="hud-label">Goal</span><strong>{challenge.instruction}</strong></div>
            <div className="file-tabbar"><span className="file-tab"><i aria-hidden="true">JS</i> main.js</span><span className="editor-language">JavaScript</span></div>
            <div className="editor-frame">
              <EditorSurface ref={editor} source={state.source} diagnostic={state.observation.state === 'invalid' ? state.observation.diagnostic : undefined} onChange={controller.changeSource} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
            </div>
            <ProgramTrace challenge={challenge} outcomes={state.outcomes} confirmed={controller.freshRun} />
            <MobileCodingRow onInsert={(value) => editor.current?.insert(value)} />
            <RuntimePanel challenge={challenge} runtime={state.runtime} />
            {challenge.evidence?.role === 'transfer' && <div className="transfer-exit"><button className="text-button danger-text" onClick={() => { if (window.confirm('End this transfer attempt and record that you did not complete it?')) controller.endTransferAttempt() }}>I’m stuck · end attempt</button></div>}
            <WorkspaceActionDock state={state} freshRun={controller.freshRun} allPassed={controller.allPassed} runRequired={controller.runRequired} onUndo={() => editor.current?.undo()} onReset={reset} onRun={() => void controller.run()} onCheck={() => void controller.check()} />
          </section>
          <TeachingHud challenge={challenge} state={state} onHint={() => void controller.requestHint()} onReveal={reveal} />
        </main>
      )}
    </div>
  )
}
