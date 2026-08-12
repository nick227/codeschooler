import { z } from 'zod'

const EventEnvelopeShape = {
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime({ offset: true }),
  sessionId: z.string().min(1).max(128),
  attemptId: z.string().min(1).max(128),
  challengeId: z.string().min(1),
  challengeRevision: z.number().int().positive(),
}

const EventSchema = <Name extends string, Data extends z.ZodTypeAny>(name: Name, data: Data) =>
  z.object({ ...EventEnvelopeShape, name: z.literal(name), data }).strict()
const DataSchema = <Shape extends z.ZodRawShape>(shape: Shape) => z.object(shape).strict()

export const TransferOutcomeSchema = z.enum(['independent', 'with-hints', 'failed'])
export type TransferOutcome = z.infer<typeof TransferOutcomeSchema>

const TransferResultDataSchema = DataSchema({
  sequenceId: z.string().min(1),
  outcome: TransferOutcomeSchema,
  hintLevelUsed: z.number().int().min(0).max(4),
  checkAttemptCount: z.number().int().nonnegative(),
}).superRefine((value, context) => {
  if (value.outcome === 'independent' && value.hintLevelUsed !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['hintLevelUsed'], message: 'independent transfer cannot use hints' })
  }
  if (value.outcome === 'with-hints' && value.hintLevelUsed === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['hintLevelUsed'], message: 'with-hints transfer must use a hint' })
  }
})

// Deliberately contains no source text, console output, diagnostics, free-form
// learner input, email, IP address, or user-agent. Stable authored keys let us
// study the learning interaction without retaining learner programs.
export const LearningTelemetryEventSchema = z.discriminatedUnion('name', [
  EventSchema('challenge_started', DataSchema({ evidenceRole: z.enum(['guided-practice', 'transfer']).optional() })),
  EventSchema('meaningful_parse_state', DataSchema({ stateKey: z.string().min(1).max(128), ordinal: z.number().int().positive() })),
  EventSchema('repeated_misconception', DataSchema({ misconceptionKey: z.string().min(1).max(128), occurrenceCount: z.number().int().min(2) })),
  EventSchema('hint_level_used', DataSchema({ level: z.number().int().min(1).max(4) })),
  EventSchema('run', DataSchema({ runCount: z.number().int().positive(), succeeded: z.boolean() })),
  EventSchema('check_attempt', DataSchema({ attemptCount: z.number().int().positive(), checksPassed: z.number().int().nonnegative(), checksTotal: z.number().int().positive() })),
  EventSchema('completion', DataSchema({ checkAttemptCount: z.number().int().positive(), hintLevelUsed: z.number().int().min(0).max(4), durationMs: z.number().int().nonnegative() })),
  EventSchema('transfer_result', TransferResultDataSchema),
  EventSchema('concept_check_result', DataSchema({ sequenceId: z.string().min(1), quizSetId: z.string().min(1), correctCount: z.number().int().nonnegative(), questionCount: z.number().int().positive() }).refine((value) => value.correctCount <= value.questionCount, { message: 'correctCount cannot exceed questionCount' })),
  EventSchema('time_to_first_success', DataSchema({ durationMs: z.number().int().nonnegative() })),
])

export type LearningTelemetryEvent = z.infer<typeof LearningTelemetryEventSchema>

export function parseLearningTelemetryEvent(input: unknown): LearningTelemetryEvent {
  return LearningTelemetryEventSchema.parse(input)
}
