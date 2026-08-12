const PREFIX = 'code-trainer:draft:v1:'
const COMPLETION_PREFIX = 'code-trainer:completion:v1:'
const EVIDENCE_PREFIX = 'code-trainer:evidence:v1:'
const MERGE_KEY = 'code-trainer:anonymous-merge-key:v1'

export interface LocalProgressSummary {
  completedChallengeCount: number
  totalXp: number
}

export interface SavedDraft {
  schemaVersion: 1
  challengeId: string
  contentRevision: number
  source: string
  updatedAt: string
}

export interface AnonymousEvidence {
  clientEventId: string
  challengeId: string
  contentRevision: number
  kind: 'PRACTICE' | 'TRANSFER' | 'CONCEPT_CHECK'
  result: 'INDEPENDENT_SUCCESS' | 'HINTED_SUCCESS' | 'FAILED'
  hintsUsed: number
  attempts: number
  occurredAt: string
}

export interface AnonymousMergePayload {
  idempotencyKey: string
  drafts: SavedDraft[]
  evidence: AnonymousEvidence[]
  telemetry: unknown[]
}

function valuesWithPrefix<T>(prefix: string): T[] {
  const values: T[] = []
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (!key?.startsWith(prefix)) continue
    try { values.push(JSON.parse(localStorage.getItem(key) ?? '') as T) } catch { /* malformed anonymous data is ignored */ }
  }
  return values
}

function id(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const localDraftRepository = {
  load(challengeId: string): SavedDraft | null {
    try {
      const raw = localStorage.getItem(`${PREFIX}${challengeId}`)
      return raw ? (JSON.parse(raw) as SavedDraft) : null
    } catch {
      return null
    }
  },
  save(challengeId: string, contentRevision: number, source: string): void {
    const draft: SavedDraft = {
      schemaVersion: 1,
      challengeId,
      contentRevision,
      source,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${PREFIX}${challengeId}`, JSON.stringify(draft))
  },
  markCompleted(challengeId: string, xpAwarded: number): boolean {
    const key = `${COMPLETION_PREFIX}${challengeId}`
    if (localStorage.getItem(key)) return false
    localStorage.setItem(key, JSON.stringify({ completedAt: new Date().toISOString(), xpAwarded }))
    return true
  },
  recordEvidence(evidence: Omit<AnonymousEvidence, 'clientEventId' | 'occurredAt'> & Partial<Pick<AnonymousEvidence, 'clientEventId' | 'occurredAt'>>): void {
    const record: AnonymousEvidence = { ...evidence, clientEventId: evidence.clientEventId ?? id(), occurredAt: evidence.occurredAt ?? new Date().toISOString() }
    localStorage.setItem(`${EVIDENCE_PREFIX}${record.clientEventId}`, JSON.stringify(record))
  },
  exportForMerge(): AnonymousMergePayload {
    let idempotencyKey = localStorage.getItem(MERGE_KEY)
    if (!idempotencyKey) {
      idempotencyKey = `anonymous-${id()}`
      localStorage.setItem(MERGE_KEY, idempotencyKey)
    }
    return {
      idempotencyKey,
      drafts: valuesWithPrefix<SavedDraft>(PREFIX),
      evidence: valuesWithPrefix<AnonymousEvidence>(EVIDENCE_PREFIX),
      // Telemetry owns its source-free queue and exposes records under this prefix.
      telemetry: valuesWithPrefix<unknown>('code-trainer:telemetry:v1:'),
    }
  },
  clearMergedAnonymousData(): void {
    const prefixes = [PREFIX, COMPLETION_PREFIX, EVIDENCE_PREFIX, 'code-trainer:telemetry:v1:']
    const keys: string[] = []
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(MERGE_KEY)
  },
  isCompleted(challengeId: string): boolean {
    return Boolean(localStorage.getItem(`${COMPLETION_PREFIX}${challengeId}`))
  },
  getProgressSummary(): LocalProgressSummary {
    let completedChallengeCount = 0
    let totalXp = 0
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key?.startsWith(COMPLETION_PREFIX)) continue
      try {
        const value = JSON.parse(localStorage.getItem(key) ?? '{}') as { xpAwarded?: number }
        completedChallengeCount++
        totalXp += Math.max(0, Number(value.xpAwarded) || 0)
      } catch {
        // Ignore a malformed local record; valid progress remains available.
      }
    }
    return { completedChallengeCount, totalXp }
  },
}
