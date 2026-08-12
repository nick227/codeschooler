# 13 - Skill Mastery & Progress

## Three progress levels
### Account
Overall XP, level, streak, awards, activity.

### Track
Completion and current position within JavaScript Fundamentals, Interview Patterns, Projects, etc.

### Skill
Independent mastery estimates for concepts such as arrays, function returns, hash maps, or dynamic programming.

## Skill object
```ts
interface Skill {
  id: string
  name: string
  aliases: string[]
  prerequisites: string[]
  category: string
  deprecated?: boolean
  replacementId?: string
}
```

## Evidence model
Skill confidence should update from evidence rather than raw completion count:
- guided coding success
- independent coding success
- project application
- interview problem success
- knowledge assessment accuracy
- spaced repeat success
- hint dependence

Exact weighting should remain configurable until real usage data exists.

Practice and assessment evidence must remain distinguishable. Higher mastery bands require multiple independent observations across different contexts. Aging evidence becomes `Mastered - needs refresh`; time alone does not silently lower the displayed mastery band.

## Progress UI
For a skill such as Dynamic Programming show:
- current mastery band
- evidence count
- related completed/remaining content
- weakest subskills
- recommended next activity

## Recommendation rule
Recommendations should primarily close prerequisite or mastery gaps, not merely push the next item in a list.

## Data durability
Mastery records reference stable skill IDs, not curriculum positions. Reordering lessons must not invalidate progress.
