import { parseLearningTelemetryEvent, type LearningTelemetryEvent } from '@code-trainer/telemetry-contract'

const PREFIX = 'code-trainer:telemetry:v1:'
const SESSION_KEY = 'code-trainer:telemetry-session:v1'
const id = () => crypto.randomUUID()

function sessionId(): string {
  let value = sessionStorage.getItem(SESSION_KEY)
  if (!value) { value = id(); sessionStorage.setItem(SESSION_KEY, value) }
  return value
}

export interface TelemetryContext { attemptId: string; challengeId: string; challengeRevision: number }

export const localTelemetryRepository = {
  newAttemptId: id,
  record(context: TelemetryContext, event: Pick<LearningTelemetryEvent, 'name' | 'data'>): void {
    const candidate = parseLearningTelemetryEvent({
      eventId: id(), occurredAt: new Date().toISOString(), sessionId: sessionId(), ...context, ...event,
    })
    const key = `${PREFIX}${candidate.eventId}`
    localStorage.setItem(key, JSON.stringify(candidate))

    // Authenticated sessions persist telemetry immediately. Anonymous and
    // offline sessions retain the same source-free event for the idempotent
    // account-merge path; a 401 or network failure intentionally leaves it
    // queued locally.
    if (typeof fetch === 'function') {
      void fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/telemetry/events`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events: [candidate] }),
      }).then((response) => {
        if (response.ok) localStorage.removeItem(key)
      }).catch(() => { /* the merge queue is the offline fallback */ })
    }
  },
}
