import { z } from 'zod'

// Check names are compiled into evaluator-owned JavaScript probe expressions.
// Restrict them to plain identifiers so authored content cannot alter a probe.
const JavaScriptIdentifierSchema = z
  .string()
  .regex(/^[A-Za-z_$][\w$]*$/, 'must be a JavaScript identifier')

// Value types allowed in evaluator `value` fields (primitives, arrays, objects).
const ValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.any()),
  z.record(z.any()),
])

const ArgsSchema = z.array(z.any())
// Evaluator registry: curriculum declares checks, software implements them.
// docs/12-evaluation-language-platform.md. Only the check types actually
// implemented by packages/evaluators are modeled here — extend both together.
export const ChallengeCheckSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('variableExists'), name: JavaScriptIdentifierSchema }).strict(),
  z.object({ type: z.literal('variableEquals'), name: JavaScriptIdentifierSchema, value: ValueSchema }).strict(),
  z.object({ type: z.literal('outputEquals'), value: z.union([z.string(), z.number()]) }).strict(),
  z.object({ type: z.literal('outputContains'), value: z.string() }).strict(),
  z.object({ type: z.literal('functionExists'), name: JavaScriptIdentifierSchema }).strict(),
  z.object({ type: z.literal('functionReturns'), name: JavaScriptIdentifierSchema, args: ArgsSchema, value: ValueSchema }).strict(),
])

export type ChallengeCheck = z.infer<typeof ChallengeCheckSchema>
