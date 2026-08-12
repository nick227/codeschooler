import { z } from 'zod'
import { LessonSchema } from './lesson'

export const SectionSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(LessonSchema).min(1),
})

export type Section = z.infer<typeof SectionSchema>
