import { describe, expect, it } from 'vitest'
import { AuthoritativeEvaluationService } from './AuthoritativeEvaluationService'
import { listInterviewProblems, listProjects, listSectionsForTrack } from '@code-trainer/learning-engine'
import type { Challenge } from '@code-trainer/content-schema'

async function runChallengeEvaluation(challenge: Challenge) {
  const service = new AuthoritativeEvaluationService()
  // reference solution
  const ref = await service.check(challenge.authoring.referenceSolution, challenge)
  if (!ref.complete) return { challengeId: challenge.id, ok: false, reason: 'reference' }
  // accepted alternates
  for (const fixture of challenge.authoring.acceptedSolutions) {
    const r = await service.check(fixture.source, challenge)
    if (!r.complete) return { challengeId: challenge.id, ok: false, reason: `accepted:${fixture.name}` }
  }
  // rejected fixtures must fail
  for (const fixture of challenge.authoring.rejectedSolutions) {
    const r = await service.check(fixture.source, challenge)
    if (r.complete) return { challengeId: challenge.id, ok: false, reason: `rejected:${fixture.name}` }
  }
  return { challengeId: challenge.id, ok: true }
}

describe('authoritative server-side evaluation for authored fixtures', () => {
  const challenges = [
    ...listSectionsForTrack('javascript-fundamentals').flatMap((s) => s.lessons.flatMap((l) => l.challenges)),
    ...listProjects().flatMap((p) => p.milestones.map((m) => m.challenge)),
    ...listInterviewProblems().map((p) => p.challenge),
  ]

  for (const ch of challenges) {
    const sourceSample = String(ch.authoring.referenceSolution || '')
    const containsAsync = /\bPromise\b|\.then\(|\basync\b|\bawait\b|setTimeout\(|setInterval\(/.test(sourceSample)
    const supportsServer = ch.runtime.environment === 'worker' && !ch.runtime.capabilities.dom && !ch.runtime.capabilities.timers && !containsAsync
    const testFn = supportsServer ? it : it.skip
    testFn(`${ch.id} passes authoritative evaluation fixtures`, async () => {
      // supply lastSuccessfulRunSource when challenge requiresRun so server marks complete
      const service = new AuthoritativeEvaluationService()
      const source = ch.authoring.referenceSolution
      const ref = await service.check(source, ch, ch.requiresRun ? source : undefined)
      if (!ref.complete) {
        // early fail with diagnostics
        expect(ref.complete, `${ch.id} reference failed`).toBe(true)
      }
      for (const fixture of ch.authoring.acceptedSolutions) {
        const r = await service.check(fixture.source, ch, ch.requiresRun ? fixture.source : undefined)
        expect(r.complete, `${ch.id} accepted ${fixture.name} failed`).toBe(true)
      }
      for (const fixture of ch.authoring.rejectedSolutions) {
        const r = await service.check(fixture.source, ch, ch.requiresRun ? fixture.source : undefined)
        expect(r.complete, `${ch.id} rejected ${fixture.name} unexpectedly passed`).toBe(false)
      }
    })
  }
})
