import { z } from 'zod'
import { ChallengeSchema } from './challenge'

export const DifficultySchema = z.enum(['beginner', 'easy', 'medium', 'hard'])

export const InterviewProblemSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  difficulty: DifficultySchema,
  pattern: z.string().min(1),
  challenge: ChallengeSchema,
})
export type InterviewProblem = z.infer<typeof InterviewProblemSchema>

export const ProjectMilestoneSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  challenge: ChallengeSchema,
})
export type ProjectMilestone = z.infer<typeof ProjectMilestoneSchema>

export const ProjectSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
  milestones: z.array(ProjectMilestoneSchema).min(1),
})
export type Project = z.infer<typeof ProjectSchema>
