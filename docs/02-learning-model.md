# 02 - Learning Model

## Core hierarchy
`Track -> Section -> Lesson -> Challenge -> Check`

`Skill` lives outside this hierarchy and is referenced by all content.

## Why skills are separate
A lesson can move, be replaced, or disappear while a learner's mastery remains valid. Projects, interview problems, and quizzes can all reinforce the same skill.

Example:
- Learn challenge: array indexing
- Project task: render a selected item from an array
- Interview problem: two-pointer array search
- Knowledge question: array access complexity

All may reference `arrays.indexing` or related canonical skills.

## Guidance progression
### Guided
Frequent feedback, partial-progress recognition, syntax explanations, explicit goals.

### Supported
Hints available, less automatic intervention, multi-line tasks.

### Independent
Requirements-first tasks, minimal scaffolding, tests and output as primary feedback.

### Assessment
No unsolicited hints before submission; feedback emphasizes correctness, complexity, and reasoning.

## Mastery evidence
Mastery should consider multiple kinds of evidence:
- successful code execution
- semantic challenge checks
- repeated success over time
- success without high-level hints
- project application
- interview problem solving
- conceptual quiz performance

Completion and mastery are not the same metric.

Practice evidence and assessment evidence remain distinct internally. A high mastery band requires multiple independent observations across contexts; one successful challenge is never sufficient. Evidence may become stale, but the learner-facing state should read `Mastered - needs refresh` rather than silently lowering prior demonstrated capability.
