import { z } from 'zod'

// Skills live outside the Track -> Section -> Lesson -> Challenge hierarchy.
// A lesson can move or be replaced while a learner's mastery of a skill remains valid.
// docs/02-learning-model.md, docs/13-skill-mastery-progress.md
export const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  prerequisites: z.array(z.string()).default([]),
  deprecated: z.boolean().default(false),
  replacementId: z.string().min(1).optional(),
})

export type Skill = z.infer<typeof SkillSchema>
