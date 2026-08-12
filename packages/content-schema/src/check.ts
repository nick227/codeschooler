import { z } from 'zod'

// Check names are compiled into evaluator-owned JavaScript probe expressions.
// Restrict them to plain identifiers so authored content cannot alter a probe.
const JavaScriptIdentifierSchema = z
  .string()
  .regex(/^[A-Za-z_$][\w$]*$/, 'must be a JavaScript identifier')

// Evaluator registry: curriculum declares checks, software implements them.
// docs/12-evaluation-language-platform.md. Only the check types actually
// implemented by packages/evaluators are modeled here — extend both together.
export const ChallengeCheckSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('variableExists'), name: JavaScriptIdentifierSchema }),
  z.object({ type: z.literal('variableEquals'), name: JavaScriptIdentifierSchema, value: z.unknown() }),
  z.object({ type: z.literal('outputEquals'), value: z.string() }),
  z.object({ type: z.literal('outputContains'), value: z.string() }),
  z.object({ type: z.literal('functionExists'), name: JavaScriptIdentifierSchema }),
  z.object({
    type: z.literal('functionReturns'),
    name: JavaScriptIdentifierSchema,
    args: z.array(z.unknown()),
    value: z.unknown(),
  }),
])

export type ChallengeCheck = z.infer<typeof ChallengeCheckSchema>
