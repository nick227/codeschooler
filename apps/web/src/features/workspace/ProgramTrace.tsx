import type { CheckOutcome } from '@code-trainer/evaluators'
import type { PublicChallenge } from './workspace.types'

export function ProgramTrace({ challenge, outcomes, confirmed }: { challenge: PublicChallenge; outcomes: CheckOutcome[]; confirmed: boolean }) {
  const nameCheck = challenge.checks.find((check) => check.type === 'variableExists')
  const valueCheck = challenge.checks.find((check) => check.type === 'variableEquals')
  const valuePassed = outcomes.find((outcome) => outcome.check.type === 'variableEquals')?.passed
  if (!nameCheck || !valueCheck || !valuePassed) return <div className="program-trace trace-empty"><span>Program state will appear here after the line is ready.</span></div>
  return (
    <div className={`program-trace ${confirmed ? 'is-confirmed' : ''}`} aria-label={`${nameCheck.name} holds the value ${String(valueCheck.value)}${confirmed ? ', confirmed by running the program' : ''}`}>
      <code>{nameCheck.name}</code><i /><small>holds</small><i /><strong>{String(valueCheck.value)}</strong>
      <span className="trace-status">{confirmed ? 'Run confirmed' : 'Ready to run'}</span>
    </div>
  )
}
