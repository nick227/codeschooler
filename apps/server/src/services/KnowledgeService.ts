import { db, Prisma } from '@code-trainer/db'
import { getQuestionPrivate } from '@code-trainer/learning-engine'
import type { Question } from '@code-trainer/content-schema'

export interface AnswerInput {
  questionId: string
  selectedOptionIds: string[]
  attemptId: string
  durationMs: number
  hintsUsed?: number
}

export class KnowledgeService {
  grade(input: AnswerInput) {
    const found = getQuestionPrivate(input.questionId)
    if (!found) throw { statusCode: 404, message: 'Question not found' }
    return { correct: answerMatches(found.question, input.selectedOptionIds), explanation: found.question.answer.explanation, duplicate: false }
  }

  async submit(userId: string, input: AnswerInput) {
    const found = getQuestionPrivate(input.questionId)
    if (!found) throw { statusCode: 404, message: 'Question not found' }
    const existing = await db.questionAttempt.findUnique({
      where: { userId_attemptId: { userId, attemptId: input.attemptId } },
    })
    if (existing) {
      if (existing.questionId !== input.questionId) throw { statusCode: 409, message: 'Attempt ID already used' }
      return { correct: existing.correct, explanation: found.question.answer.explanation, duplicate: true }
    }

    const correct = answerMatches(found.question, input.selectedOptionIds)
    const result = correct ? (input.hintsUsed ?? 0) === 0 ? 'INDEPENDENT_SUCCESS' : 'HINTED_SUCCESS' : 'FAILED'
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.questionAttempt.create({
        data: {
          userId, attemptId: input.attemptId, questionId: input.questionId, quizSetId: found.quizSet.id,
          selectedOptionIds: input.selectedOptionIds, correct, hintsUsed: input.hintsUsed ?? 0, durationMs: input.durationMs,
        },
      })
      await tx.learningEvidence.create({
        data: {
          userId, clientEventId: `question:${input.attemptId}`, challengeId: input.questionId,
          contentRevision: found.question.revision, kind: 'CONCEPT_CHECK', result,
          hintsUsed: input.hintsUsed ?? 0, attempts: 1, occurredAt: new Date(), verified: true,
        },
      })
      for (const skillId of found.question.skills) {
        const current = await tx.masteryRecord.findUnique({ where: { userId_skillId: { userId, skillId } } })
        const score = correct ? ((input.hintsUsed ?? 0) === 0 ? 1 : 0.8) : 0
        await tx.masteryRecord.upsert({
          where: { userId_skillId: { userId, skillId } },
          create: { userId, skillId, masteryScore: score, evidenceCount: 1 },
          update: { masteryScore: Math.max(current?.masteryScore ?? 0, score), evidenceCount: { increment: 1 } },
        })
      }
    })
    return { correct, explanation: found.question.answer.explanation, duplicate: false }
  }
}

function answerMatches(question: Question, selected: string[]) {
  let expected: string[]
  let orderMatters = false
  if ('correctOptionIds' in question.answer) expected = [...question.answer.correctOptionIds].sort()
  else if ('value' in question.answer) expected = [String(question.answer.value)]
  else if ('orderedItemIds' in question.answer) { expected = question.answer.orderedItemIds; orderMatters = true }
  else expected = question.answer.pairs.map((pair: { leftId: string; rightId: string }) => `${pair.leftId}:${pair.rightId}`)
  const actual = orderMatters ? selected : [...selected].sort()
  return expected.length === actual.length && expected.every((value, index) => value === actual[index])
}
