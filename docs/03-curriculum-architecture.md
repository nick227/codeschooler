# 03 - Curriculum Architecture

## Boundary
The application understands generic learning primitives. Curriculum is declarative content that composes those primitives.

```text
Software                    Curriculum
Editor                      Tracks
Runner                      Sections
Evaluator                   Lessons
Assistant                   Challenges
Progress Engine             Skills references
Rewards Engine              Hints
Navigation                  Checks
Content Renderer            Reward metadata
```

## Dependency direction
`Curriculum -> Content Schema -> Learning Engine -> Runtime/UI`

Never allow UI or runtime code to import individual lesson modules or special-case content IDs.

## Suggested repository shape
```text
/apps
  /web
  /api
/packages
  /learning-engine
  /editor
  /runner
  /evaluators
  /language-javascript
  /content-schema
/content
  /javascript/learn
  /javascript/projects
  /javascript/interview
  /knowledge
```

## Content objects
### Track
Top-level learning path such as JavaScript Fundamentals or Interview Patterns.

### Section
A coherent group within a track, such as Variables or Two Pointers.

### Lesson
A teaching unit containing one or more challenges.

### Challenge
Executable work with instructions, starter state, checks, skills, guidance policy, and rewards.

### Skill
Canonical capability with prerequisites and mastery metadata.

## Durable identity and revisions
- Skill IDs are immutable and support aliases, deprecation metadata, and replacement IDs.
- Content IDs are immutable and content carries a revision.
- Editorial revisions preserve completion. Material changes to objectives, measured skills, evaluator behavior, difficulty, or required competency may require new evidence.

## Content portability
The first version loads repository-managed declarative content. The schema must allow later synchronization into MySQL through Prisma or loading from another database, CMS, or remote content service without changing workspace behavior.
