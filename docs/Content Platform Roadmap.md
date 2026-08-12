# Code Trainer Content Platform Roadmap

## Goal

Move curriculum from repository-only YAML into a database-backed content platform without losing the declarative contract that already works.

Target workflow:

```text
YAML / AI / Human Author
        ↓
Content Import / Creation
        ↓
Draft Content in MySQL
        ↓
Validate + Categorize + Tag
        ↓
Live Run in Real Workspace
        ↓
Review
        ↓
Publish Revision
        ↓
Learner Application
```

YAML remains useful for:

* golden fixtures
* seed content
* bulk import/export
* regression tests
* source-controlled examples

MySQL becomes the source of truth for active authoring and published curriculum.

---

# Phase 1 — Establish the content domain model

Do this before building the admin UI.

## Core models

```text
ContentItem
ContentRevision
Category
Tag
Skill
ContentSkill
ContentCategory
ContentTag
ContentRelation
ContentGeneration
```

### ContentItem

Stable identity across revisions.

```ts
ContentItem {
  id
  slug
  type
  language
  status
  currentRevisionId
  createdAt
  updatedAt
}
```

`type` should support the four pillars without creating separate storage systems:

```text
coding_challenge
project_step
interview_problem
knowledge_question
```

Potential future types:

```text
lesson
assessment
article
example
```

Do not encode pillar directly into the content type.

---

## ContentRevision

Immutable authored version.

```ts
ContentRevision {
  id
  contentItemId
  revision
  title
  instruction
  body
  starterCode
  solution
  config
  difficulty
  guidancePolicy
  createdBy
  createdAt
  publishedAt
}
```

`config` can contain validated type-specific content:

```json
{
  "checks": [],
  "hints": [],
  "runtime": {},
  "question": {}
}
```

Prefer a schema per content type rather than arbitrary JSON everywhere.

Published revisions should never be edited in place.

Editing published content creates:

```text
revision 4 → published
revision 5 → draft
```

---

# Phase 2 — Establish categories, tags, and skills

These three concepts must remain distinct.

## Categories

Categories describe **where content belongs**.

They should be hierarchical.

```text
JavaScript
└── Learn
    ├── Getting Started
    ├── Variables
    ├── Functions
    └── Arrays
```

Model:

```ts
Category {
  id
  slug
  name
  parentId?
  kind
  sortOrder
}
```

Suggested `kind`:

```text
pillar
track
section
topic
collection
```

A content item may belong to multiple categories, but one category can optionally be marked as its primary placement.

---

## Tags

Tags describe editorial characteristics and discovery attributes.

Examples:

```text
off-by-one
common-mistake
good-review
visual
short
requires-runtime
interview-common
beginner-trap
```

Model:

```ts
Tag {
  id
  slug
  name
  description?
}
```

Tags are flat.

Do not use tags for curriculum hierarchy.

---

## Skills

Skills represent **what the learner is demonstrating**.

Examples:

```text
javascript.variables.declaration
javascript.variables.assignment
javascript.arrays.indexing
algorithms.two-pointers
```

Skills retain the durable V1 contract:

```ts
Skill {
  id
  slug
  name
  description
  deprecatedAt?
  replacementSkillId?
}
```

Relations:

```text
ContentItem ↔ Skill
ContentItem ↔ Category
ContentItem ↔ Tag
```

This allows:

```text
Category = where it lives
Skill    = what it teaches/tests
Tag      = how editors describe/find it
```

That distinction should be enforced in the admin UI.

---

# Phase 3 — Build the repository abstraction

The learner application should never care whether content came from YAML or MySQL.

Create:

```ts
interface ContentRepository {
  get(id: string): Promise<ContentItem>
  getRevision(id: string): Promise<ContentRevision>
  query(filters: ContentQuery): Promise<ContentItem[]>
}
```

Implement:

```text
YamlContentRepository
PrismaContentRepository
```

Then point the learning engine at `ContentRepository`.

Do not let components import Prisma models directly.

Target dependency:

```text
Workspace
   ↓
Learning Engine
   ↓
ContentRepository
   ↓
Prisma
```

---

# Phase 4 — Create the seed/import path

Make seeding explicit and repeatable.

## Seed pipeline

```text
/content/**/*.yaml
       ↓
parse
       ↓
schema validation
       ↓
resolve skills/categories/tags
       ↓
normalize
       ↓
upsert ContentItem
       ↓
insert/update revision
       ↓
validate reference solution
       ↓
report
```

Command:

```bash
pnpm content:seed
```

Useful variants:

```bash
pnpm content:seed --dry-run
pnpm content:seed --file getting-started.yaml
pnpm content:seed --replace
```

Default behavior should be safe and idempotent.

Stable YAML IDs must map directly to stable database IDs/slugs.

Do not create duplicates every time the seed runs.

---

## Seed system rules

Seed:

* categories
* canonical tags where useful
* skills
* content
* revisions
* relationships

Report:

```text
Skills       27 inserted / 4 unchanged
Categories   12 inserted / 0 changed
Tags         18 inserted
Content       7 inserted / 2 updated
Errors        0
```

CI should be able to run:

```bash
pnpm content:validate
pnpm content:seed --dry-run
```

without needing production infrastructure.

---

# Phase 5 — Content API routes

Separate public learner reads from admin authoring routes.

## Learner routes

```text
GET /api/content
GET /api/content/:id
GET /api/content/:id/revision
GET /api/categories
GET /api/categories/:slug/content
GET /api/skills/:slug/content
```

Filters:

```text
pillar
language
type
category
tag
skill
difficulty
status
search
```

Public routes should return published content only.

---

## Admin content routes

```text
GET    /api/admin/content
POST   /api/admin/content
GET    /api/admin/content/:id
PATCH  /api/admin/content/:id

POST   /api/admin/content/:id/revisions
GET    /api/admin/content/:id/revisions
GET    /api/admin/content/:id/revisions/:revisionId

POST   /api/admin/content/:id/validate
POST   /api/admin/content/:id/test
POST   /api/admin/content/:id/publish
POST   /api/admin/content/:id/archive

POST   /api/admin/content/import
GET    /api/admin/content/export
```

Important distinction:

```text
save draft
validate
test
publish
```

These are separate operations.

---

# Phase 6 — Taxonomy management routes

## Categories

```text
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
POST   /api/admin/categories/reorder
```

Prevent deletion when referenced unless explicitly reassigned.

---

## Tags

```text
GET    /api/admin/tags
POST   /api/admin/tags
PATCH  /api/admin/tags/:id
DELETE /api/admin/tags/:id
```

Support:

```text
merge tag
rename tag
find unused tags
```

Tag cleanup will matter once AI starts generating content.

---

## Skills

Skills should have stricter management than tags.

```text
GET   /api/admin/skills
POST  /api/admin/skills
PATCH /api/admin/skills/:id
POST  /api/admin/skills/:id/deprecate
```

Do not casually delete canonical skills once learner evidence references them.

---

# Phase 7 — Build the Admin Content Studio

Primary route:

```text
/admin/content
```

## Content list

Keep the first screen operational rather than dashboard-heavy.

```text
Content                                    [+ New] [Generate]

Search __________________________

Learn | JavaScript | Draft | Variables | + Filters

────────────────────────────────────────────
Assign a Variable             Draft
Declare a Constant            Published
Predict the Output            Review
Fix the Assignment            Draft
────────────────────────────────────────────
```

Columns:

```text
Title
Type
Category
Difficulty
Status
Revision
Updated
```

Filters should expose:

```text
pillar
type
language
category
skill
tag
difficulty
status
```

Do not expose every filter by default. Use progressive disclosure.

---

# Phase 8 — Content editor screen

Route:

```text
/admin/content/:id
```

Recommended layout:

```text
┌───────────────────────┬────────────────────────────┐
│ CONTENT               │ LIVE EXPERIENCE            │
│                       │                            │
│ title                 │ actual ChallengeWorkspace  │
│ instruction           │                            │
│ starter code          │ actual HUD                 │
│ checks                │                            │
│ hints                 │ actual runtime             │
│ difficulty            │                            │
│ skills                │                            │
│ categories            │                            │
│ tags                  │                            │
├───────────────────────┴────────────────────────────┤
│ Save Draft   Validate   Test   Publish             │
└────────────────────────────────────────────────────┘
```

The preview must use the **real application surfaces**, not a fake preview component.

That lets an author change:

```text
instruction
starter code
hint
check
```

and immediately experience the learner flow.

This is one of the highest-value pieces of the system.

---

# Phase 9 — Validation and live-run tooling

Each content item should expose a validation report.

Example:

```text
Schema
✓ valid

Skills
✓ javascript.variables.assignment exists

Reference solution
✓ passes 3/3 checks

Rejection fixtures
✓ 4/4 rejected

Alternate solutions
✓ 3/3 accepted

Hints
! structural hint may reveal answer

Runtime
✓ completes in 14ms
```

Admin actions:

```text
Validate
Run Reference
Run Fixture
Open as Learner
```

`Open as Learner` should launch the content through the actual workspace using the draft revision.

That is how content tuning should happen.

---

# Phase 10 — Add AI generation

Only after manual create/edit/publish works.

Route:

```text
/admin/content/generate
```

AI request example:

```text
Generate 20 beginner JavaScript challenges.

Category:
Variables

Skills:
- javascript.variables.declaration
- javascript.variables.assignment

Difficulty:
Beginner

Constraints:
- one primary concept each
- no duplicate objectives
- progressive difficulty
```

Pipeline:

```text
AI response
   ↓
schema validation
   ↓
draft ContentItems
   ↓
automatic evaluator tests
   ↓
Needs Review
```

Never:

```text
AI → Published
```

---

# Phase 11 — Track generation provenance

Add:

```ts
ContentGeneration {
  id
  provider
  model
  promptVersion
  prompt
  createdAt
}
```

And:

```text
ContentRevision.generationId?
```

This makes it possible later to answer:

```text
Which prompt generated these weak hints?
Which model generated these 300 questions?
Which generated batch had the highest rejection rate?
```

That will become valuable quickly.

---

# Phase 12 — Content lifecycle

Establish one lifecycle everywhere:

```text
DRAFT
  ↓
VALIDATED
  ↓
REVIEW
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Avoid ten statuses.

AI content starts:

```text
DRAFT
```

A successful automated validation can produce:

```text
VALIDATED
```

Human approval produces:

```text
PUBLISHED
```

---

# Phase 13 — Migration of existing YAML

Do not immediately delete current YAML loading.

Transition:

```text
Phase A
YAML runtime + DB available

Phase B
DB becomes runtime default
YAML remains fixture/seed source

Phase C
Production content exclusively DB
Golden YAML fixtures remain in repository
```

Your existing seven Variables challenges become the first **golden fixtures** and should survive the migration.

---

# Phase 14 — Admin permissions

Start simple:

```text
admin
content_editor
```

Capabilities:

```text
content_editor
- create
- edit drafts
- validate
- preview

admin
- publish
- archive
- taxonomy changes
- skill governance
- AI batch generation
```

You can expand later if multiple curriculum teams emerge.

---

# Phase 15 — Definition of done

The content platform is ready for large-scale AI authoring when this complete path works:

```text
create category
     ↓
create/select skills
     ↓
generate or import challenge
     ↓
draft saved in DB
     ↓
edit in admin
     ↓
assign categories + tags + skills
     ↓
live-run in real workspace
     ↓
reference solution passes
     ↓
validation passes
     ↓
human publishes
     ↓
learner sees published revision
     ↓
completion records exact content revision
```

At that point generating hundreds of questions becomes an **editorial scaling problem**, not an engineering migration problem.

## Recommended implementation order

```text
1. Prisma content/taxonomy models
2. Shared content schemas
3. Prisma ContentRepository
4. YAML → DB seed/import pipeline
5. Public DB-backed content reads
6. Admin CRUD routes
7. Categories/tags/skills management
8. Admin content list
9. Content editor + real workspace preview
10. Validation/test/publish lifecycle
11. Existing YAML migration
12. AI batch generation
13. Generation provenance and quality analytics
```

The critical milestone is **#9**. Once a human can change a draft and immediately run that exact content through Code Trainer, you have the authoring loop needed to iterate quickly. AI generation should plug into that loop rather than define it.
