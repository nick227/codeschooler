import { z } from 'zod'

const QuestionBaseShape = {
  id: z.string().min(1),
  revision: z.number().int().positive(),
  prompt: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
}

export const QuestionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
})

const ChoiceQuestionSchema = z.object({
  ...QuestionBaseShape,
  type: z.enum([
    'multiple-choice',
    'multiple-select',
    'predict-output',
    'identify-bug',
    'choose-better-implementation',
  ]),
  options: z.array(QuestionOptionSchema).min(2),
  answer: z.object({
    correctOptionIds: z.array(z.string().min(1)).min(1),
    explanation: z.string().min(1),
  }),
})

const TrueFalseQuestionSchema = z.object({
  ...QuestionBaseShape,
  type: z.literal('true-false'),
  answer: z.object({ value: z.boolean(), explanation: z.string().min(1) }),
})

const OrderingQuestionSchema = z.object({
  ...QuestionBaseShape,
  type: z.literal('ordering'),
  items: z.array(QuestionOptionSchema).min(2),
  answer: z.object({ orderedItemIds: z.array(z.string().min(1)).min(2), explanation: z.string().min(1) }),
})

const MatchingQuestionSchema = z.object({
  ...QuestionBaseShape,
  type: z.literal('matching'),
  left: z.array(QuestionOptionSchema).min(2),
  right: z.array(QuestionOptionSchema).min(2),
  answer: z.object({
    pairs: z.array(z.object({ leftId: z.string().min(1), rightId: z.string().min(1) })).min(2),
    explanation: z.string().min(1),
  }),
})

export const QuestionSchema = z.discriminatedUnion('type', [
  ChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  OrderingQuestionSchema,
  MatchingQuestionSchema,
])
export type Question = z.infer<typeof QuestionSchema>

export const QuizSetSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  mode: z.enum(['practice', 'checkpoint', 'interview-review']),
  purpose: z.enum(['knowledge', 'concept-check']),
  evidenceSequenceId: z.string().min(1).optional(),
  questions: z.array(QuestionSchema).min(1),
}).superRefine((quiz, context) => {
  if (quiz.purpose === 'concept-check' && !quiz.evidenceSequenceId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['evidenceSequenceId'], message: 'concept checks require an evidence sequence' })
  }
})
export type QuizSet = z.infer<typeof QuizSetSchema>
