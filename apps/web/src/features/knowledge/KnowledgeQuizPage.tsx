import { FormEvent, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ErrorState, LoadingState } from '../../components/AsyncState'
import { localDraftRepository } from '../workspace/persistence/LocalDraftRepository'
import { localTelemetryRepository } from '../workspace/persistence/LocalTelemetryRepository'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
type Question = { id: string; revision: number; type: string; prompt: string; skills: string[]; options?: Array<{ id: string; label: string }> }
type Quiz = { id: string; revision: number; title: string; description: string; purpose: 'knowledge' | 'concept-check'; evidenceSequenceId?: string; questions: Question[] }

export function KnowledgeQuizPage() {
  const { quizId } = useParams()
  const startedAt = useRef(Date.now())
  const quizAttemptId = useRef(`knowledge-${crypto.randomUUID()}`)
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean; explanations: string[] }>()
  const [submitError, setSubmitError] = useState('')
  const quiz = useQuery({
    queryKey: ['quiz-set', quizId], enabled: Boolean(quizId),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/quiz-sets/${quizId}`)
      if (!response.ok) throw new Error('Quiz unavailable')
      return (await response.json() as { data: Quiz }).data
    },
  })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!quiz.data) return
    const values = new FormData(event.currentTarget)
    const answers = quiz.data.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: [String(values.get(question.id) ?? '')],
    }))
    const checkedAnswers = await Promise.all(answers.map(async (answer) => {
      const response = await fetch(`${API_URL}/knowledge/answers`, {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...answer, attemptId: `${quizAttemptId.current}:${answer.questionId}`, durationMs: Date.now() - startedAt.current, hintsUsed: 0 }),
      })
      if (!response.ok) throw new Error('answer check failed')
      return (await response.json() as { data: { correct: boolean; explanation: string; duplicate: boolean } }).data
    })).catch(() => undefined)
    if (!checkedAnswers) { setSubmitError('Your answers could not be checked. They remain selected; try again.'); return }
    const correct = checkedAnswers.filter((answer) => answer.correct).length
    const checked = { correct, total: checkedAnswers.length, passed: correct === checkedAnswers.length, explanations: checkedAnswers.map((answer) => answer.explanation).filter(Boolean) }
    setResult(checked)
    localDraftRepository.recordEvidence({
      challengeId: quiz.data.id, contentRevision: quiz.data.revision,
      kind: quiz.data.purpose === 'concept-check' ? 'CONCEPT_CHECK' : 'PRACTICE',
      result: checked.passed ? 'INDEPENDENT_SUCCESS' : 'FAILED', hintsUsed: 0, attempts: 1,
    })
    if (quiz.data.purpose === 'concept-check' && quiz.data.evidenceSequenceId) {
      localTelemetryRepository.record({ attemptId: quizAttemptId.current, challengeId: quiz.data.id, challengeRevision: quiz.data.revision }, { name: 'concept_check_result', data: { sequenceId: quiz.data.evidenceSequenceId, quizSetId: quiz.data.id, correctCount: checked.correct, questionCount: checked.total } })
    }
  }

  if (quiz.isLoading) return <AppShell><div className="quiz-page"><LoadingState label="Preparing concept check…" /></div></AppShell>
  if (!quiz.data) return <AppShell><div className="quiz-page"><ErrorState message="This quiz could not be loaded." retry={() => void quiz.refetch()} /></div></AppShell>
  return <AppShell><main className="quiz-page">
    <Link className="text-button" to="/knowledge">← Knowledge</Link>
    <header><p className="eyebrow">{quiz.data.purpose === 'concept-check' ? 'Concept check' : 'Knowledge practice'}</p><h1>{quiz.data.title}</h1><p>{quiz.data.description}</p></header>
    {result ? <section className="quiz-result" aria-live="polite"><span className="completion-seal">✓</span><h2>{result.correct} of {result.total}</h2><p>{result.passed ? 'Your answers add fresh evidence to these skills.' : 'Review the linked skills, then try a fresh attempt.'}</p>{result.explanations.length > 0 && <ul className="quiz-explanations">{result.explanations.map((explanation, index) => <li key={`${index}-${explanation}`}>{explanation}</li>)}</ul>}<Link className="primary-button" to="/knowledge">Continue</Link></section>
      : <form className="quiz-form" onSubmit={(event) => void submit(event)}>
        {quiz.data.questions.map((question, index) => <fieldset key={question.id}><legend><small>{String(index + 1).padStart(2, '0')}</small>{question.prompt}</legend><div className="quiz-options">
          {(question.options ?? [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]).map((option) => <label key={option.id}><input required type="radio" name={question.id} value={option.id} /><span>{option.label}</span></label>)}
        </div></fieldset>)}
        {submitError && <p role="alert" className="auth-error">{submitError}</p>}
        <button className="primary-button">Check my understanding</button>
      </form>}
  </main></AppShell>
}
