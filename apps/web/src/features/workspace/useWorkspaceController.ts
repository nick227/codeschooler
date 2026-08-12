import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { checkChallenge, runProgram } from '@code-trainer/evaluators'
import { DEFAULT_RUNTIME_MANIFEST, executeDom, observeSource, parse } from '@code-trainer/language-javascript'
import { useAssistantHint, useCurrentUser, useSubmitAttempt } from '@code-trainer/sdk'
import { localDraftRepository } from './persistence/LocalDraftRepository'
import { localTelemetryRepository } from './persistence/LocalTelemetryRepository'
import { requiresRun, responseForDiagnostic, responseForOutcomes } from './teachingPolicy'
import type { PublicChallenge, TeachingResponse, WorkspaceViewState } from './workspace.types'

function initialSource(challenge: PublicChallenge): string {
  const draft = localDraftRepository.load(challenge.id)
  return draft?.source ?? challenge.starterCode
}

export function useWorkspaceController(challenge: PublicChallenge) {
  const runtime = challenge.runtime ?? DEFAULT_RUNTIME_MANIFEST
  const telemetryContext = useRef({ attemptId: localTelemetryRepository.newAttemptId(), challengeId: challenge.id, challengeRevision: challenge.revision ?? 1 })
  const startedAt = useRef(Date.now())
  const versionRef = useRef(0)
  const checkAttempts = useRef(0)
  const failedTransferRecorded = useRef(false)
  const runCount = useRef(0)
  const parseOrdinal = useRef(0)
  const lastParseState = useRef<string>()
  const misconceptionCounts = useRef(new Map<string, number>())
  const sourceRef = useRef(initialSource(challenge))
  const [state, setState] = useState<WorkspaceViewState>(() => ({
    phase: 'editing',
    source: sourceRef.current,
    sourceVersion: 0,
    parseResult: parse(sourceRef.current),
    observation: observeSource(sourceRef.current),
    outcomes: [],
    runtime: { visible: false, status: 'idle' },
    hintLevel: 0,
    hintsUsed: 0,
    saveStatus: 'idle',
  }))
  const assistantHint = useAssistantHint()
  const submitAttempt = useSubmitAttempt()
  const currentUser = useCurrentUser()

  const freshRun = state.runtime.status === 'success' && state.runtime.sourceVersion === state.sourceVersion
  const allPassed = state.outcomes.length > 0 && state.outcomes.every((outcome) => outcome.passed)
  const runRequired = requiresRun(challenge)

  useEffect(() => {
    localTelemetryRepository.record(telemetryContext.current, { name: 'challenge_started', data: { evidenceRole: challenge.evidence?.role } })
  }, [challenge.evidence?.role])

  useEffect(() => {
    const stateKey = state.observation.state
    if (lastParseState.current === stateKey) return
    lastParseState.current = stateKey
    localTelemetryRepository.record(telemetryContext.current, { name: 'meaningful_parse_state', data: { stateKey, ordinal: ++parseOrdinal.current } })
  }, [state.observation.state])

  const changeSource = useCallback((source: string) => {
    const sourceVersion = ++versionRef.current
    sourceRef.current = source
    const parseResult = parse(source)
    const observation = observeSource(source)
    setState((current) => ({
      ...current,
      phase: 'editing',
      source,
      sourceVersion,
      parseResult,
      observation,
      outcomes: [],
      teaching: undefined,
      runtime: current.runtime.visible ? { ...current.runtime, status: 'idle' } : current.runtime,
      saveStatus: 'idle',
    }))
  }, [])

  const recordMisconception = useCallback((response: TeachingResponse | undefined) => {
    if (!response || (response.kind !== 'diagnostic' && response.kind !== 'hint')) return
    const count = (misconceptionCounts.current.get(response.key) ?? 0) + 1
    misconceptionCounts.current.set(response.key, count)
    if (count === 2) {
      localTelemetryRepository.record(telemetryContext.current, {
        name: 'repeated_misconception',
        data: { misconceptionKey: response.key, occurrenceCount: count },
      })
    }
  }, [])

  useEffect(() => {
    if (!currentUser.data || versionRef.current !== 0) return
    let active = true
    void fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/drafts/${challenge.id}`, { credentials: 'include' })
      .then(async (response) => response.ok ? (await response.json() as { data: { source: string; updatedAt: string } | null }).data : null)
      .then((serverDraft) => {
        if (!active || !serverDraft || versionRef.current !== 0) return
        const localDraft = localDraftRepository.load(challenge.id)
        if (localDraft && new Date(localDraft.updatedAt) >= new Date(serverDraft.updatedAt)) return
        changeSource(serverDraft.source)
      }).catch(() => { /* local draft remains authoritative while offline */ })
    return () => { active = false }
  }, [challenge.id, changeSource, currentUser.data])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localDraftRepository.save(challenge.id, challenge.revision ?? 1, state.source)
        if (currentUser.data) {
          void fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/drafts/${challenge.id}`, {
            method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ contentRevision: challenge.revision ?? 1, source: state.source, updatedAt: new Date().toISOString() }),
          })
        }
        setState((current) => current.sourceVersion === state.sourceVersion ? { ...current, saveStatus: 'saved' } : current)
      } catch {
        setState((current) => ({ ...current, saveStatus: 'error' }))
      }
    }, 750)
    return () => window.clearTimeout(timer)
  }, [challenge.id, challenge.revision, currentUser.data, state.source, state.sourceVersion])

  useEffect(() => {
    const save = () => {
      try { localDraftRepository.save(challenge.id, challenge.revision ?? 1, sourceRef.current) } catch { /* local recovery is best effort */ }
    }
    window.addEventListener('pagehide', save)
    return () => window.removeEventListener('pagehide', save)
  }, [challenge.id, challenge.revision])

  useEffect(() => {
    if (state.observation.state === 'incomplete' || state.observation.state === 'invalid') {
      const diagnostic = state.observation.diagnostic
      if (!diagnostic) return
      const version = state.sourceVersion
      const timer = window.setTimeout(() => {
        const response = responseForDiagnostic(state.source, diagnostic)
        recordMisconception(response)
        setState((current) => current.sourceVersion === version
          ? { ...current, phase: 'feedback', teaching: response }
          : current)
      }, 700)
      return () => window.clearTimeout(timer)
    }
    if (state.observation.state !== 'valid') return

    const version = state.sourceVersion
    const source = state.source
    const timer = window.setTimeout(async () => {
      setState((current) => current.sourceVersion === version ? { ...current, phase: 'observing' } : current)
      const result = await checkChallenge(source, challenge as never, { executionOptions: { timeoutMs: Math.min(700, runtime.timeoutMs), maxOutputBytes: runtime.maxOutputBytes, capabilities: runtime.capabilities } })
      if (versionRef.current !== version) return
      setState((current) => {
        if (current.sourceVersion !== version) return current
        const hasFreshRun = current.runtime.status === 'success' && current.runtime.sourceVersion === version
        return {
          ...current,
          phase: 'editing',
          outcomes: result.outcomes,
          teaching: responseForOutcomes(source, challenge, result.outcomes, hasFreshRun),
        }
      })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [challenge, recordMisconception, runtime, state.observation, state.source, state.sourceVersion])

  const persistBeforeAction = useCallback(() => {
    try { localDraftRepository.save(challenge.id, challenge.revision ?? 1, sourceRef.current) } catch { /* shown by regular autosave */ }
  }, [challenge.id, challenge.revision])

  const run = useCallback(async () => {
    runCount.current += 1
    persistBeforeAction()
    const source = sourceRef.current
    const version = versionRef.current
    const parsed = parse(source)
    if (!parsed.valid) {
      localTelemetryRepository.record(telemetryContext.current, { name: 'run', data: { runCount: runCount.current, succeeded: false } })
      setState((current) => ({ ...current, phase: 'feedback', parseResult: parsed, teaching: parsed.diagnostic ? responseForDiagnostic(source, parsed.diagnostic) : current.teaching }))
      return
    }
    setState((current) => ({ ...current, phase: 'running', runtime: { visible: true, status: 'running' } }))
    const executionOptions = { timeoutMs: runtime.timeoutMs, maxOutputBytes: runtime.maxOutputBytes, capabilities: runtime.capabilities }
    const result = runtime.environment === 'dom' ? await executeDom(source, executionOptions) : await runProgram(source, executionOptions)
    localTelemetryRepository.record(telemetryContext.current, { name: 'run', data: { runCount: runCount.current, succeeded: result.success } })
    if (versionRef.current !== version) return
    setState((current) => ({
      ...current,
      phase: 'editing',
      runtime: { visible: true, status: result.success ? 'success' : 'error', result, sourceVersion: result.success ? version : undefined },
      teaching: result.success
        ? (current.outcomes.length ? responseForOutcomes(source, challenge, current.outcomes, true) : { key: 'run.success', kind: 'acknowledgement', message: 'Your program ran. Check your work when you’re ready.' })
        : { key: 'runtime.error', kind: 'diagnostic', message: result.error?.message ?? 'This program could not run yet.' },
    }))
  }, [challenge, persistBeforeAction, runtime])

  const check = useCallback(async () => {
    checkAttempts.current += 1
    persistBeforeAction()
    if (!state.parseResult.valid) {
      localTelemetryRepository.record(telemetryContext.current, { name: 'check_attempt', data: { attemptCount: checkAttempts.current, checksPassed: 0, checksTotal: Math.max(1, challenge.checks.length) } })
      setState((current) => ({ ...current, phase: 'feedback', teaching: current.parseResult.diagnostic ? responseForDiagnostic(current.source, current.parseResult.diagnostic) : current.teaching }))
      return
    }
    setState((current) => ({ ...current, phase: 'checking' }))
    const checkedSource = state.source
    const checkedVersion = state.sourceVersion
    const checked = await checkChallenge(checkedSource, challenge as never, {
      lastSuccessfulRunSource: freshRun ? checkedSource : undefined,
      executionOptions: { timeoutMs: runtime.timeoutMs, maxOutputBytes: runtime.maxOutputBytes, capabilities: runtime.capabilities },
    })
    localTelemetryRepository.record(telemetryContext.current, { name: 'check_attempt', data: { attemptCount: checkAttempts.current, checksPassed: checked.outcomes.filter((outcome) => outcome.passed).length, checksTotal: Math.max(1, challenge.checks.length) } })
    checked.outcomes.forEach((outcome, index) => {
      if (outcome.passed) return
      const misconceptionKey = `check.${index}.not-passed`
      const occurrenceCount = (misconceptionCounts.current.get(misconceptionKey) ?? 0) + 1
      misconceptionCounts.current.set(misconceptionKey, occurrenceCount)
      if (occurrenceCount >= 2) localTelemetryRepository.record(telemetryContext.current, { name: 'repeated_misconception', data: { misconceptionKey, occurrenceCount } })
    })
    if (versionRef.current !== checkedVersion) return
    if (!checked.execution.success || !checked.complete) {
      if (challenge.evidence?.role === 'transfer') {
        localTelemetryRepository.record(telemetryContext.current, { name: 'transfer_result', data: { sequenceId: challenge.evidence.sequenceId, outcome: 'failed', hintLevelUsed: state.hintLevel, checkAttemptCount: checkAttempts.current } })
        localDraftRepository.recordEvidence({
          challengeId: challenge.id, contentRevision: challenge.revision ?? 1,
          kind: 'TRANSFER', result: 'FAILED', hintsUsed: state.hintsUsed,
          attempts: checkAttempts.current,
        })
      }
      const teaching = checked.runRequired
        ? { key: 'check.needs-run', kind: 'ready' as const, message: 'Run this version first, then check your work.' }
        : checked.execution.success
          ? responseForOutcomes(checkedSource, challenge, checked.outcomes, freshRun) ?? { key: 'check.incomplete', kind: 'hint' as const, message: 'Not there yet. Compare your code with each part of the goal.' }
          : { key: 'check.runtime-error', kind: 'diagnostic' as const, message: checked.execution.error?.message ?? 'This program could not be checked yet.' }
      recordMisconception(teaching)
      setState((current) => ({
        ...current,
        phase: 'feedback',
        outcomes: checked.outcomes,
        teaching,
      }))
      return
    }
    // An authenticated browser never writes a provisional local reward. The
    // server is the only authority that may complete and award that attempt.
    const locallyNew = currentUser.data ? false : localDraftRepository.markCompleted(challenge.id, challenge.reward.xp)
    if (challenge.evidence?.role === 'transfer' && !currentUser.data) {
      localDraftRepository.recordEvidence({
        challengeId: challenge.id,
        contentRevision: challenge.revision ?? 1,
        kind: 'TRANSFER',
        result: state.hintsUsed === 0 ? 'INDEPENDENT_SUCCESS' : 'HINTED_SUCCESS',
        hintsUsed: state.hintsUsed,
        attempts: checkAttempts.current,
      })
    }
    const durationMs = Date.now() - startedAt.current
    let completion = currentUser.data
      ? { newlyCompleted: false, xpAwarded: 0 }
      : { newlyCompleted: locallyNew, xpAwarded: locallyNew ? challenge.reward.xp : 0 }
    try {
      const result = await submitAttempt.mutateAsync({
        clientAttemptId: crypto.randomUUID(),
        challengeId: challenge.id,
        source: checkedSource,
        hintsUsed: state.hintsUsed,
        durationMs: Date.now() - startedAt.current,
        ...(freshRun ? { lastSuccessfulRunSource: checkedSource } : {}),
      })
      if (result) {
        if (!result.authoritative.complete) {
          setState((current) => ({ ...current, phase: 'feedback', teaching: { key: 'check.server-rejected', kind: 'diagnostic', message: 'Server verification did not pass yet. Your draft is safe; review the goal and check again.' } }))
          return
        }
        completion = { newlyCompleted: result.newlyCompleted, xpAwarded: result.xpJustAwarded }
      }
    } catch {
      if (currentUser.data) {
        setState((current) => ({ ...current, phase: 'feedback', teaching: { key: 'check.verification-offline', kind: 'ready', message: 'Your code looks ready, but rewards need server verification. Check again when the connection returns.' } }))
        return
      }
      // Anonymous learners keep local, mergeable evidence. Account merge
      // rechecks its source before any authenticated reward is granted.
    }
    if (challenge.evidence?.role === 'transfer') {
      localTelemetryRepository.record(telemetryContext.current, { name: 'transfer_result', data: { sequenceId: challenge.evidence.sequenceId, outcome: state.hintLevel === 0 ? 'independent' : 'with-hints', hintLevelUsed: state.hintLevel, checkAttemptCount: checkAttempts.current } })
    }
    localTelemetryRepository.record(telemetryContext.current, { name: 'completion', data: { checkAttemptCount: checkAttempts.current, hintLevelUsed: state.hintLevel, durationMs } })
    if (completion.newlyCompleted) localTelemetryRepository.record(telemetryContext.current, { name: 'time_to_first_success', data: { durationMs } })
    setState((current) => ({
      ...current,
      phase: 'complete',
      completion,
      teaching: { key: 'challenge.complete', kind: 'complete', message: `You completed ${challenge.title}.` },
    }))
  }, [challenge, currentUser.data, freshRun, persistBeforeAction, recordMisconception, runtime, state.hintsUsed, state.parseResult.valid, state.source, state.sourceVersion, submitAttempt])

  const requestHint = useCallback(async (reveal = false) => {
    const nextLevel = reveal ? 4 : Math.min(3, state.hintLevel + 1)
    let response: TeachingResponse
    try {
      const result = await assistantHint.mutateAsync({
        challengeId: challenge.id,
        source: state.source,
        diagnosticMessage: state.parseResult.diagnostic?.message,
        runtimeErrorMessage: state.runtime.result?.error?.message,
        checkOutcomes: state.outcomes.map(({ label, passed }) => ({ label, passed })),
        previousHintLevel: state.hintLevel,
        userRequestedReveal: reveal,
      })
      if (!result) throw new Error('No hint response')
      response = { key: `hint.${result.level}`, kind: 'hint', message: result.message }
    } catch {
      const name = challenge.checks.find((item) => item.type === 'variableExists')?.name ?? 'score'
      const value = challenge.checks.find((item) => item.type === 'variableEquals')?.value ?? 10
      const fallback = [
        '',
        'A variable gives a value a name so you can use it later.',
        'A declaration has a keyword, a name, an equals sign, and a value.',
        `Try this shape: const ${name} = ___`,
        `const ${name} = ${JSON.stringify(value)}`,
      ]
      response = { key: `hint.${nextLevel}`, kind: 'hint', message: fallback[nextLevel] ?? fallback[1]! }
    }
    setState((current) => ({ ...current, phase: 'feedback', hintLevel: nextLevel, hintsUsed: current.hintsUsed + 1, teaching: response }))
    localTelemetryRepository.record(telemetryContext.current, { name: 'hint_level_used', data: { level: nextLevel } })
  }, [assistantHint, challenge.checks, challenge.id, state.hintLevel, state.outcomes, state.parseResult.diagnostic?.message, state.runtime.result?.error?.message, state.source])

  const reset = useCallback(() => {
    persistBeforeAction()
    changeSource(challenge.starterCode)
  }, [challenge.starterCode, changeSource, persistBeforeAction])

  const endTransferAttempt = useCallback(() => {
    if (challenge.evidence?.role !== 'transfer' || failedTransferRecorded.current) return
    failedTransferRecorded.current = true
    localDraftRepository.recordEvidence({
      challengeId: challenge.id, contentRevision: challenge.revision ?? 1,
      kind: 'TRANSFER', result: 'FAILED', hintsUsed: state.hintsUsed,
      attempts: Math.max(1, checkAttempts.current),
    })
    setState((current) => ({ ...current, phase: 'feedback', teaching: { key: 'transfer.ended', kind: 'acknowledgement', message: 'This transfer attempt is recorded. You can review the lesson or keep experimenting here.' } }))
  }, [challenge.evidence?.role, challenge.id, challenge.revision, state.hintsUsed])

  return useMemo(() => ({ state, freshRun, allPassed, runRequired, changeSource, run, check, requestHint, reset, endTransferAttempt }), [state, freshRun, allPassed, runRequired, changeSource, run, check, requestHint, reset, endTransferAttempt])
}
