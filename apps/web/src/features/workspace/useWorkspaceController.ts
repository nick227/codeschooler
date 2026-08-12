import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { checkChallenge, runProgram } from '@code-trainer/evaluators'
import { observeSource, parse } from '@code-trainer/language-javascript'
import { useAssistantHint, useSubmitAttempt } from '@code-trainer/sdk'
import { localDraftRepository } from './persistence/LocalDraftRepository'
import { requiresRun, responseForDiagnostic, responseForOutcomes } from './teachingPolicy'
import type { PublicChallenge, TeachingResponse, WorkspaceViewState } from './workspace.types'

function initialSource(challenge: PublicChallenge): string {
  const draft = localDraftRepository.load(challenge.id)
  return draft?.source ?? challenge.starterCode
}

export function useWorkspaceController(challenge: PublicChallenge) {
  const startedAt = useRef(Date.now())
  const versionRef = useRef(0)
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

  const freshRun = state.runtime.status === 'success' && state.runtime.sourceVersion === state.sourceVersion
  const allPassed = state.outcomes.length > 0 && state.outcomes.every((outcome) => outcome.passed)
  const runRequired = requiresRun(challenge)

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localDraftRepository.save(challenge.id, challenge.revision ?? 1, state.source)
        setState((current) => current.sourceVersion === state.sourceVersion ? { ...current, saveStatus: 'saved' } : current)
      } catch {
        setState((current) => ({ ...current, saveStatus: 'error' }))
      }
    }, 750)
    return () => window.clearTimeout(timer)
  }, [challenge.id, challenge.revision, state.source, state.sourceVersion])

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
        setState((current) => current.sourceVersion === version
          ? { ...current, phase: 'feedback', teaching: responseForDiagnostic(current.source, diagnostic) }
          : current)
      }, 700)
      return () => window.clearTimeout(timer)
    }
    if (state.observation.state !== 'valid') return

    const version = state.sourceVersion
    const source = state.source
    const timer = window.setTimeout(async () => {
      setState((current) => current.sourceVersion === version ? { ...current, phase: 'observing' } : current)
      const result = await checkChallenge(source, challenge as never, { executionOptions: { timeoutMs: 700 } })
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
  }, [challenge, state.observation, state.source, state.sourceVersion])

  const persistBeforeAction = useCallback(() => {
    try { localDraftRepository.save(challenge.id, challenge.revision ?? 1, sourceRef.current) } catch { /* shown by regular autosave */ }
  }, [challenge.id, challenge.revision])

  const run = useCallback(async () => {
    persistBeforeAction()
    const source = sourceRef.current
    const version = versionRef.current
    const parsed = parse(source)
    if (!parsed.valid) {
      setState((current) => ({ ...current, phase: 'feedback', parseResult: parsed, teaching: parsed.diagnostic ? responseForDiagnostic(source, parsed.diagnostic) : current.teaching }))
      return
    }
    setState((current) => ({ ...current, phase: 'running', runtime: { visible: true, status: 'running' } }))
    const result = await runProgram(source)
    if (versionRef.current !== version) return
    setState((current) => ({
      ...current,
      phase: 'editing',
      runtime: { visible: true, status: result.success ? 'success' : 'error', result, sourceVersion: result.success ? version : undefined },
      teaching: result.success
        ? (current.outcomes.length ? responseForOutcomes(source, challenge, current.outcomes, true) : { key: 'run.success', kind: 'acknowledgement', message: 'Your program ran. Check your work when you’re ready.' })
        : { key: 'runtime.error', kind: 'diagnostic', message: result.error?.message ?? 'This program could not run yet.' },
    }))
  }, [challenge, persistBeforeAction])

  const check = useCallback(async () => {
    persistBeforeAction()
    if (!state.parseResult.valid) {
      setState((current) => ({ ...current, phase: 'feedback', teaching: current.parseResult.diagnostic ? responseForDiagnostic(current.source, current.parseResult.diagnostic) : current.teaching }))
      return
    }
    setState((current) => ({ ...current, phase: 'checking' }))
    const checkedSource = state.source
    const checkedVersion = state.sourceVersion
    const checked = await checkChallenge(checkedSource, challenge as never, {
      lastSuccessfulRunSource: freshRun ? checkedSource : undefined,
    })
    if (versionRef.current !== checkedVersion) return
    if (!checked.execution.success || !checked.complete) {
      setState((current) => ({
        ...current,
        phase: 'feedback',
        outcomes: checked.outcomes,
        teaching: checked.runRequired
          ? { key: 'check.needs-run', kind: 'ready', message: 'Run this version first, then check your work.' }
          : checked.execution.success
            ? responseForOutcomes(checkedSource, challenge, checked.outcomes, freshRun) ?? { key: 'check.incomplete', kind: 'hint', message: 'Not there yet. Compare your code with each part of the goal.' }
            : { key: 'check.runtime-error', kind: 'diagnostic', message: checked.execution.error?.message ?? 'This program could not be checked yet.' },
      }))
      return
    }
    const locallyNew = localDraftRepository.markCompleted(challenge.id, challenge.reward.xp)
    let completion = { newlyCompleted: locallyNew, xpAwarded: locallyNew ? challenge.reward.xp : 0 }
    try {
      const result = await submitAttempt.mutateAsync({
        challengeId: challenge.id,
        source: checkedSource,
        passed: true,
        checksTotal: checked.outcomes.length,
        checksPassed: checked.outcomes.length,
        hintsUsed: state.hintsUsed,
        durationMs: Date.now() - startedAt.current,
      })
      if (result) completion = { newlyCompleted: result.newlyCompleted, xpAwarded: result.xpJustAwarded }
    } catch {
      // Anonymous learners keep a local, mergeable completion. Coding never blocks on sign-in.
    }
    setState((current) => ({
      ...current,
      phase: 'complete',
      completion,
      teaching: { key: 'challenge.complete', kind: 'complete', message: `You completed ${challenge.title}.` },
    }))
  }, [challenge, freshRun, persistBeforeAction, state.hintsUsed, state.parseResult.valid, state.source, state.sourceVersion, submitAttempt])

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
  }, [assistantHint, challenge.checks, challenge.id, state.hintLevel, state.outcomes, state.parseResult.diagnostic?.message, state.runtime.result?.error?.message, state.source])

  const reset = useCallback(() => {
    persistBeforeAction()
    changeSource(challenge.starterCode)
  }, [challenge.starterCode, changeSource, persistBeforeAction])

  return useMemo(() => ({ state, freshRun, allPassed, runRequired, changeSource, run, check, requestHint, reset }), [state, freshRun, allPassed, runRequired, changeSource, run, check, requestHint, reset])
}
