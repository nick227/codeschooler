import { z } from 'zod'
import { ChallengeSchema } from './challenge'

// docs/03-curriculum-architecture.md: "Lesson - A teaching unit containing
// one or more challenges." Early beginner lessons are 1:1 with a challenge;
// the schema allows more without a shape change later.
export const LessonSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  challenges: z.array(ChallengeSchema).min(1),
})

export type Lesson = z.infer<typeof LessonSchema>
