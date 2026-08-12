# 11 - Challenge Authoring Standard

## Required fields
```ts
interface Challenge {
  id: string
  revision: number
  language: string
  title: string
  instruction: string
  starterCode: string
  skills: string[]
  guidance: 'guided' | 'supported' | 'independent' | 'assessment'
  checks: ChallengeCheck[]
  hints?: Hint[]
  reward?: RewardSpec
  requiresRun?: boolean
}
```

## Authoring rules
1. State one clear outcome.
2. Test behavior or semantics rather than exact source whenever possible.
3. Add checks that expose useful partial progress.
4. Make hints progressively more revealing.
5. Keep required syntax limited to what has already been taught unless the lesson introduces it.
6. Include edge cases only when relevant to the skill being trained.
7. Tag every challenge with canonical skills.
8. Separate challenge intent from assistant prose where possible.
9. Avoid hidden style requirements unless explicitly taught.
10. Provide a reference solution for author validation, not as the evaluator's only accepted answer.

## Publishing gate
Before publication, content must pass schema validation, resolve every skill ID, execute its reference solution successfully, reject known incorrect fixtures, accept reasonable alternate solutions, and receive hint-ladder, difficulty, and guidance review followed by human approval.

## Example
```json
{
  "id": "js-variable-001",
  "language": "javascript",
  "title": "Create a Score",
  "instruction": "Create a variable named score with the value 10.",
  "starterCode": "",
  "skills": ["javascript.variables", "javascript.numbers"],
  "guidance": "guided",
  "checks": [
    { "type": "variableExists", "name": "score" },
    { "type": "variableEquals", "name": "score", "value": 10 }
  ],
  "reward": { "xp": 20 }
}
```
