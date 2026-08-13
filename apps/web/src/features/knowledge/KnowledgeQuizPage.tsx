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

interface CheckedAnswer {
  questionId: string
  correct: boolean
  explanation: string
  selectedOptionId: string
}

interface QuizResult {
  correct: number
  total: number
  passed: boolean
  answers: CheckedAnswer[]
}

export function KnowledgeQuizPage() {
  const { quizId } = useParams()
  const startedAt = useRef(Date.now())
  const quizAttemptId = useRef(`knowledge-${crypto.randomUUID()}`)
  const [result, setResult] = useState<QuizResult>()
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
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
    const rawAnswers = quiz.data.questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: String(values.get(question.id) ?? ''),
    }))

    const checkedAnswers = await Promise.all(rawAnswers.map(async (ans) => {
      const response = await fetch(`${API_URL}/knowledge/answers`, {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: ans.questionId, selectedOptionIds: [ans.selectedOptionId], attemptId: `${quizAttemptId.current}:${ans.questionId}`, durationMs: Date.now() - startedAt.current, hintsUsed: 0 }),
      })
      if (!response.ok) throw new Error('answer check failed')
      const res = await response.json() as { data: { correct: boolean; explanation: string; duplicate: boolean } }
      return {
        questionId: ans.questionId,
        correct: res.data.correct,
        explanation: res.data.explanation,
        selectedOptionId: ans.selectedOptionId,
      } as CheckedAnswer
    })).catch(() => undefined)

    if (!checkedAnswers) {
      setSubmitError('Your answers could not be checked. They remain selected; try again.')
      return
    }

    const correctCount = checkedAnswers.filter((a) => a.correct).length
    const finalResult: QuizResult = {
      correct: correctCount,
      total: checkedAnswers.length,
      passed: correctCount === checkedAnswers.length,
      answers: checkedAnswers,
    }

    setResult(finalResult)
    localDraftRepository.recordEvidence({
      challengeId: quiz.data.id, contentRevision: quiz.data.revision,
      kind: quiz.data.purpose === 'concept-check' ? 'CONCEPT_CHECK' : 'PRACTICE',
      result: finalResult.passed ? 'INDEPENDENT_SUCCESS' : 'FAILED', hintsUsed: 0, attempts: 1,
    })

    if (quiz.data.purpose === 'concept-check' && quiz.data.evidenceSequenceId) {
      localTelemetryRepository.record(
        { attemptId: quizAttemptId.current, challengeId: quiz.data.id, challengeRevision: quiz.data.revision },
        { name: 'concept_check_result', data: { sequenceId: quiz.data.evidenceSequenceId, quizSetId: quiz.data.id, correctCount: finalResult.correct, questionCount: finalResult.total } }
      )
    }
  }

  if (quiz.isLoading) return <AppShell><div className="quiz-page"><LoadingState label="Preparing concept check…" /></div></AppShell>
  if (!quiz.data) return <AppShell><div className="quiz-page"><ErrorState message="This quiz could not be loaded." retry={() => void quiz.refetch()} /></div></AppShell>

  return (
    <AppShell>
      <main className="quiz-page">
        <Link className="text-button" to="/knowledge">← Return to Knowledge</Link>
        <header>
          <h1>{quiz.data.title}</h1>
          <p>{quiz.data.description}</p>
        </header>

        {result && (
          <section className="quiz-result" aria-live="polite">
            <span className="completion-seal">{result.passed ? '✓' : '!'}</span>
            <h2>{result.correct} of {result.total} Correct</h2>
            <p>{result.passed ? 'Excellent work! Your answers add fresh evidence to these skills.' : 'Review the feedback below and try a fresh attempt when ready.'}</p>
            <div className="completion-actions">
              <Link className="primary-button" to="/knowledge">Return to Knowledge</Link>
              {!result.passed && (
                <button type="button" className="secondary-button" onClick={() => setResult(undefined)}>
                  Retake quiz
                </button>
              )}
            </div>
          </section>
        )}

        <form className="quiz-form" onSubmit={(event) => void submit(event)}>
          {quiz.data.questions.map((question, index) => {
            const checkedAns = result?.answers.find((a) => a.questionId === question.id)
            const isChecked = Boolean(checkedAns)
            const options = question.options ?? [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]

            return (
              <fieldset key={question.id} className={isChecked ? (checkedAns?.correct ? 'quiz-question-passed' : 'quiz-question-failed') : ''}>
                <legend>
                  {question.prompt}
                  {isChecked && (
                    <span className={`quiz-badge ${checkedAns?.correct ? 'badge-correct' : 'badge-incorrect'}`}>
                      {checkedAns?.correct ? '✓ Correct' : '✕ Incorrect'}
                    </span>
                  )}
                </legend>

                <div className="quiz-options">
                  {options.map((option) => {
                    const isSelected = selectedAnswers[question.id] === option.id || checkedAns?.selectedOptionId === option.id

                    return (
                      <label key={option.id} className={isSelected ? 'is-selected' : ''}>
                        <input
                          required
                          type="radio"
                          name={question.id}
                          value={option.id}
                          disabled={isChecked}
                          checked={isSelected}
                          onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        />
                        <span>{option.label}</span>
                      </label>
                    )
                  })}
                </div>

                {checkedAns?.explanation && (
                  <div className="quiz-explanation-box">
                    <strong>Explanation:</strong>
                    <p>{checkedAns.explanation}</p>
                  </div>
                )}
              </fieldset>
            )
          })}

          {submitError && <p role="alert" className="auth-error">{submitError}</p>}
          {!result && <button className="primary-button">Check answers</button>}
        </form>
      </main>
    </AppShell>
  )
}
