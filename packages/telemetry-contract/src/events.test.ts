import assert from 'node:assert/strict'
import test from 'node:test'
import { LearningTelemetryEventSchema, parseLearningTelemetryEvent } from './events'

const envelope = {
  eventId: '5e7fba7b-df17-4f68-b9a2-5e35eeaa90ab',
  occurredAt: '2026-08-11T12:00:00.000Z',
  sessionId: 'session-1',
  attemptId: 'attempt-1',
  challengeId: 'js-transfer-variables-008',
  challengeRevision: 1,
}

test('accepts privacy-minimal transfer evidence', () => {
  const event = LearningTelemetryEventSchema.parse({
    ...envelope,
    name: 'transfer_result',
    data: { sequenceId: 'variables-v1', outcome: 'independent', hintLevelUsed: 0, checkAttemptCount: 1 },
  })
  assert.equal(event.name, 'transfer_result')
})

test('rejects source snapshots and impossible concept-check results', () => {
  assert.equal(LearningTelemetryEventSchema.safeParse({
    ...envelope,
    name: 'meaningful_parse_state',
    data: { stateKey: 'variable-declaration-complete', ordinal: 1, source: 'const secret = 1' },
  }).success, false)

  assert.throws(() => parseLearningTelemetryEvent({
      ...envelope,
      name: 'concept_check_result',
      data: { sequenceId: 'variables-v1', quizSetId: 'variables-concept-check', correctCount: 2, questionCount: 1 },
    }))
})
