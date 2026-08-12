# 10 - Inline Assistant Contract

## Role
The assistant is a teaching layer over editor state, challenge intent, evaluator results, and runtime behavior. It should not behave like an unrestricted answer generator by default.

## Authority boundary
The default loop is deterministic: parser/runtime/evaluator state -> learning-state interpretation -> reviewed pedagogical response. Evaluators alone determine correctness. Optional AI conversation may later rephrase explanations, answer follow-up questions, provide personalized examples, or discuss concepts, but it must not override evaluator results. The first validation slice has no live AI dependency.

## Inputs
- current source
- cursor / selection context where available
- challenge goal
- current checks and partial results
- runtime diagnostics/output
- learner mastery and guidance policy

## Hint ladder
### Level 0 - Observe
No interruption when progress is healthy.

### Level 1 - Describe
State what happened without giving the fix.

### Level 2 - Explain concept
Explain the relevant programming idea.

### Level 3 - Give structure
Provide a partial form such as `const score = ___`.

### Level 4 - Reveal solution
Give the direct answer when explicitly requested or policy allows it.

## Diagnostic style
Translate raw parser/runtime errors into beginner-appropriate language while preserving access to the real diagnostic.

Bad: `SyntaxError: Unexpected string`

Better: `"name" is text here. A variable name should not be in quotes.`

## Intervention rules
- do not interrupt on every keystroke
- recognize partial progress
- do not invent requirements absent from the challenge
- do not rewrite the user's whole solution unless asked
- distinguish syntax errors, semantic mismatch, failing tests, and suboptimal complexity
- reduce unsolicited help in interview/assessment modes
- warn when revealing a solution ends eligibility for a specific achievement, allow the learner to choose, and never block ordinary progression to protect a reward

## Success condition
The learner should feel that the assistant understands what they are trying to do, without taking control of the task away from them.
