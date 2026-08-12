import { z } from 'zod'

// A Track references Sections by id (loaded separately by the learning
// engine) rather than nesting them — sections are large enough to author as
// standalone files, and keeping the reference indirect matches "curriculum
// must be reorderable... without application rewrites" (docs/01, principle 10).
export const TrackSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  language: z.literal('javascript'),
  sectionIds: z.array(z.string()).min(1),
})

export type Track = z.infer<typeof TrackSchema>
