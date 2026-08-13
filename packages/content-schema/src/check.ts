import { z } from 'zod'

// Check names are compiled into evaluator-owned JavaScript probe expressions.
// Restrict them to plain identifiers so authored content cannot alter a probe.
const JavaScriptIdentifierSchema = z
  .string()
  .regex(/^[A-Za-z_$][\w$]*$/, 'must be a JavaScript identifier')

// Value types allowed in evaluator `value` fields (primitives, arrays, objects).
const PrimitiveValue = z.union([z.string(), z.number(), z.boolean(), z.null()])
let ValueSchema: z.ZodTypeAny
ValueSchema = z.union([
  PrimitiveValue,
  z.array(z.lazy((): z.ZodTypeAny => ValueSchema)),
  z.record(z.lazy((): z.ZodTypeAny => ValueSchema)),
])

const ArgsSchema = z.array(ValueSchema)
// Evaluator registry: curriculum declares checks, software implements them.
// docs/12-evaluation-language-platform.md. Only the check types actually
// implemented by packages/evaluators are modeled here — extend both together.
export const ChallengeCheckSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('variableExists'), name: JavaScriptIdentifierSchema }).strict(),
  // variableEquals: only primitives (string/number/boolean/null)
  z.object({ type: z.literal('variableEquals'), name: JavaScriptIdentifierSchema, value: PrimitiveValue }).strict(),
  // outputEquals: textual output comparison
  z.object({ type: z.literal('outputEquals'), value: z.string() }).strict(),
  z.object({ type: z.literal('outputContains'), value: z.string() }).strict(),
  z.object({ type: z.literal('functionExists'), name: JavaScriptIdentifierSchema }).strict(),
  // functionReturns: allow JSON-like return values (primitives, arrays, objects)
  z.object({ type: z.literal('functionReturns'), name: JavaScriptIdentifierSchema, args: ArgsSchema.optional(), value: ValueSchema }).strict(),
  // structural comparators
  z.object({ type: z.literal('arrayEquals'), name: JavaScriptIdentifierSchema, value: z.array(ValueSchema) }).strict(),
  z.object({ type: z.literal('objectEquals'), name: JavaScriptIdentifierSchema, value: z.record(ValueSchema) }).strict(),
])

export type ChallengeCheck = z.infer<typeof ChallengeCheckSchema>
