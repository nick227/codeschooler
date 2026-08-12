import { z } from 'zod'

export const ContentStatusSchema = z.enum([
  'DRAFT',
  'VALIDATED',
  'REVIEW',
  'PUBLISHED',
  'ARCHIVED',
])
export type ContentStatus = z.infer<typeof ContentStatusSchema>

export const CategoryKindSchema = z.enum([
  'pillar',
  'track',
  'section',
  'topic',
  'collection',
])
export type CategoryKind = z.infer<typeof CategoryKindSchema>

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  parentId: z.string().optional().nullable(),
  kind: CategoryKindSchema.default('section'),
  sortOrder: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
export type Category = z.infer<typeof CategorySchema>

export const TagSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
export type Tag = z.infer<typeof TagSchema>

export const ContentRevisionSchema = z.object({
  id: z.string().optional(),
  contentItemId: z.string().optional(),
  revision: z.number().default(1),
  title: z.string().min(1),
  instruction: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  starterCode: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  config: z.record(z.unknown()).default({}),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  guidancePolicy: z.record(z.unknown()).optional().nullable(),
  createdBy: z.string().optional().nullable(),
  generationId: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  createdAt: z.string().optional(),
})
export type ContentRevision = z.infer<typeof ContentRevisionSchema>

export const ContentItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.enum([
    'coding_challenge',
    'project_step',
    'interview_problem',
    'knowledge_question',
  ]),
  language: z.string().default('javascript'),
  status: ContentStatusSchema.default('DRAFT'),
  currentRevisionId: z.string().optional().nullable(),
  primaryCategoryId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  revisions: z.array(ContentRevisionSchema).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
})
export type ContentItem = z.infer<typeof ContentItemSchema>

export const ValidationReportCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['pass', 'warn', 'fail']),
  message: z.string(),
})

export const ContentValidationReportSchema = z.object({
  contentItemId: z.string(),
  valid: z.boolean(),
  checks: z.array(ValidationReportCheckSchema),
  timestamp: z.string(),
})
export type ContentValidationReport = z.infer<typeof ContentValidationReportSchema>

export const AIGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  categorySlug: z.string().optional(),
  skillIds: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  count: z.number().int().min(1).max(50).default(5),
  provider: z.string().default('built-in'),
  model: z.string().default('code-trainer-ai-v1'),
})
export type AIGenerateRequest = z.infer<typeof AIGenerateRequestSchema>
