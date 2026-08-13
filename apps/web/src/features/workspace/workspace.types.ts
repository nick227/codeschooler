import type { Diagnostic, ExecutionResult, ParseResult, RuntimeManifest, SourceObservation } from '@code-trainer/language-javascript'
import type { CheckOutcome } from '@code-trainer/evaluators'

export type PublicCheck =
  | { type: 'variableExists'; name: string }
  | { type: 'variableEquals'; name: string; value: unknown }
  | { type: 'outputEquals'; value: string }
  | { type: 'outputContains'; value: string }
  | { type: 'functionExists'; name: string }
  | { type: 'functionReturns'; name: string; args: unknown[]; value: unknown }

export interface PublicChallenge {
  id: string
  revision?: number
  language: 'javascript'
  title: string
  instruction: string
  starterCode: string
  skills: string[]
  guidance: 'guided' | 'supported' | 'independent'
  checks: PublicCheck[]
  reward: { xp: number; firstPassBonusXp?: number; lowHintBonusXp?: number }
  requiresRun?: boolean
  runtime?: RuntimeManifest
  mode?: 'learn' | 'interview' | 'project' | 'knowledge'
  evidenceKind?: 'PRACTICE' | 'TRANSFER' | 'CONCEPT_CHECK'
  evidence?: { sequenceId: string; role: 'guided-practice' | 'transfer' }
}

export type WorkspacePhase = 'editing' | 'observing' | 'running' | 'checking' | 'feedback' | 'complete'

export interface TeachingResponse {
  key: string
  kind: 'acknowledgement' | 'diagnostic' | 'hint' | 'ready' | 'complete'
  message: string
}

export interface WorkspaceViewState {
  phase: WorkspacePhase
  source: string
  sourceVersion: number
  parseResult: ParseResult
  observation: SourceObservation
  outcomes: CheckOutcome[]
  runtime: {
    visible: boolean
    status: 'idle' | 'running' | 'success' | 'error'
    result?: ExecutionResult
    sourceVersion?: number
  }
  teaching?: TeachingResponse
  hintLevel: number
  hintsUsed: number
  saveStatus: 'idle' | 'saved' | 'error'
  completion?: { newlyCompleted: boolean; xpAwarded: number }
}

export function diagnosticKey(diagnostic?: Diagnostic): string {
  if (!diagnostic) return ''
  return `${diagnostic.line}:${diagnostic.column}:${diagnostic.raw}`
}
