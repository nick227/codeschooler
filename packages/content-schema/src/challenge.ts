import { z } from 'zod'
import { ChallengeCheckSchema } from './check'

// docs/11-challenge-authoring-standard.md
export const GuidancePolicySchema = z.enum(['guided', 'supported', 'independent'])
export type GuidancePolicy = z.infer<typeof GuidancePolicySchema>

// Authored fallback hints for the assistant's hint ladder (docs/10). Level 0
// ("observe / stay silent") is never authored — it's the absence of a hint.
export const HintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  message: z.string().min(1),
})
export type Hint = z.infer<typeof HintSchema>

export const RewardSpecSchema = z.object({
  xp: z.number().int().min(0),
  firstPassBonusXp: z.number().int().min(0).optional(),
  lowHintBonusXp: z.number().int().min(0).optional(),
})
export type RewardSpec = z.infer<typeof RewardSpecSchema>

export const SolutionFixtureSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
})
export type SolutionFixture = z.infer<typeof SolutionFixtureSchema>

// Kept with authored content but removed from public challenge projections.
// These fixtures power the publishing gate; they are not learner-facing data.
export const ChallengeAuthoringSchema = z.object({
  referenceSolution: z.string().min(1),
  acceptedSolutions: z.array(SolutionFixtureSchema).min(1),
  rejectedSolutions: z.array(SolutionFixtureSchema).min(1),
})
export type ChallengeAuthoring = z.infer<typeof ChallengeAuthoringSchema>

export const RuntimeCapabilitiesSchema = z.object({
  network: z.union([z.literal(false), z.array(z.string().url()).min(1)]),
  storage: z.union([z.literal(false), z.literal('local')]),
  timers: z.boolean(),
  dom: z.boolean(),
})
export type RuntimeCapabilities = z.infer<typeof RuntimeCapabilitiesSchema>

// Every executable content item declares its sandbox needs. There are no
// implicit grants: authored content must opt into each capability and the
// runtime remains free to reject a grant it cannot isolate safely.
export const RuntimeManifestSchema = z.object({
  environment: z.enum(['worker', 'dom']),
  timeoutMs: z.number().int().min(100).max(10_000),
  maxOutputBytes: z.number().int().min(256).max(1_048_576),
  capabilities: RuntimeCapabilitiesSchema,
})
export type RuntimeManifest = z.infer<typeof RuntimeManifestSchema>

export const LearningEvidenceSchema = z.object({
  sequenceId: z.string().min(1),
  role: z.enum(['guided-practice', 'transfer']),
})
export type LearningEvidence = z.infer<typeof LearningEvidenceSchema>

export const ChallengeSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  language: z.literal('javascript'),
  title: z.string().min(1),
  instruction: z.string().min(1),
  starterCode: z.string().default(''),
  skills: z.array(z.string()).min(1),
  level: z.number().int().min(1).max(12).optional(),
  difficultyScore: z.number().int().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
  guidance: GuidancePolicySchema,
  checks: z.array(ChallengeCheckSchema).min(1),
  hints: z.array(HintSchema).default([]),
  reward: RewardSpecSchema,
  requiresRun: z.boolean().default(false),
  runtime: RuntimeManifestSchema,
  evidence: LearningEvidenceSchema.optional(),
  authoring: ChallengeAuthoringSchema,
})

export type Challenge = z.infer<typeof ChallengeSchema>
