# Project State — Code Trainer

## MVP

**What it does:** An editor-first coding education platform. Learners write and run real JavaScript in a reusable Code Workspace while an inline AI assistant diagnoses mistakes, gives graduated hints, and tracks skill mastery. Four pillars: Learn (guided lessons), Projects, Interview (LeetCode-style), Knowledge (quizzes).

**Users:** Single role (learner). No teacher/admin roles in V1.

**In V1 (vertical slice per docs/15):**
- App Shell (Home, Learn, Progress nav)
- Learn content browser (one section: "Getting Started")
- Challenge Workspace: CodeMirror editor with live JS syntax highlighting + diagnostics, HUD (goal/progress/assistant), Runtime panel (output)
- Client-side sandboxed JS execution (Web Worker) + semantic evaluators (variableExists, variableEquals, outputEquals, functionExists)
- Inline assistant: deterministic, reviewed hint ladder and teaching-state policy (Level 0-4 per docs/10); optional AI conversation is a later layer
- Auth (register/login)
- XP + progress persistence, skill mastery events
- 7-8 tightly sequenced beginner challenges (print text, edit text, print number, create variable, print variable, second variable, arithmetic)

**Parking lot (V2+):**
- Projects, Interview, Knowledge pillars (schema proven, not built out)
- Awards/achievements UI
- Multiple languages (language-adapter boundary exists, JS is the only implementation)
- Server-side re-verification of client-reported check results (see Known Limitation below)
- CMS-backed curriculum (content ships as versioned YAML in this repo for V1)

**Stack:** pnpm workspaces monorepo. `apps/web` — Vite + React + TypeScript + Tailwind + **CodeMirror 6** (not Monaco — lighter, better inline-decoration API for HUD-anchored diagnostics, better mobile/keyboard support, matches doc 09's "annotations anchored to code" requirement). `apps/server` — Fastify + TypeScript, OpenAPI-first via `fastify-openapi-glue`. `packages/db` — Prisma + MySQL, **user-state only** (see Architecture Deviations). SDK — `openapi-fetch` + React Query hooks, same pattern as factory default.

**Plugins:** none from the standard plugin catalog. The validation slice has no live AI dependency; its `AssistantService` advances reviewed, authored hints deterministically.

**Assumptions:**
- Deterministic parser, evaluator, misconception, and authored-hint systems own the teaching loop. An optional future AI boundary may rephrase or deepen explanations but never determines correctness.
- Curriculum content (Track/Section/Lesson/Challenge/Check/Skill) is declarative YAML in `/content`, not database rows — matches docs/03's explicit "content portability" requirement and enables a git-reviewable, non-engineer-editable-later authoring flow.
- Client executes and self-reports which checks passed; server persists XP/progress based on that report without re-running the code server-side. Acceptable for a preprod vertical slice proving the loop; **not acceptable for a real launch** where users could forge progress. Flagged explicitly, not silently accepted — a real launch needs either a server-side sandboxed re-verification pass or an accepted design decision that this product doesn't need anti-cheat (e.g., no leaderboards, no credentialing claims).

## Architecture Deviations from Factory Defaults

This is a learning-content platform, not a social CRUD app, so several defaults from `references/core-architecture.md` and `references/domain-defaults.md` don't apply as-is:

1. **Curriculum is not database rows.** `content/javascript/learn/*.yaml` holds Track/Section/Lesson/Challenge/Skill definitions, validated against `packages/content-schema` (Zod). `packages/learning-engine` loads and queries this content with pure functions — no DB access. The API still exposes curriculum-browsing routes (so the frontend never imports YAML directly, preserving the SDK-is-the-only-bridge rule) but those handlers read from `learning-engine`, not Prisma.
2. **Prisma owns only user-generated state**: `User`, `Session`, `Attempt`, `Progress`, `XPEvent`, `Award`, `AwardUnlock`, `MasteryRecord`. No `Track`/`Lesson`/`Challenge` tables — those would let curriculum and DB migrations couple, which docs/03 explicitly forbids ("curriculum -> content schema -> learning engine -> runtime/UI", never the reverse).
3. **Editor, runner, and evaluators run client-side and are NOT behind the SDK/API boundary.** `packages/language-javascript` (parse/execute/diagnose/inspect) and `packages/evaluators` (check registry) are imported directly into `apps/web`. This is intentional per docs/03's original software/curriculum table (Editor, Runner, Evaluator are software-layer primitives, not data-fetching concerns) and per docs/12's sandbox requirement — code execution happens in a Web Worker in the browser, never sent to the server. This is the one deliberate exception to "pages import from SDK only."
4. **Assistant correctness is deterministic.** `POST /assistant/hint` exposes the next reviewed hint without sending the complete answer ladder to the browser. Future AI conversation, if added, remains downstream of authoritative parser/runtime/evaluator state.

## Phase Completed

Phase 1 — Beginner Variables vertical slice: declarative curriculum, deterministic teaching loop, disposable Worker runtime, semantic evaluation, polished responsive workspace, anonymous persistence, XP completion, and production checks.

## Modules Built

- [x] Monorepo scaffold
- [x] content-schema + learning-engine + seven-challenge content sequence
- [x] language-javascript + evaluator registry and client-side runner
- [x] Prisma schema (user-state)
- [x] OpenAPI spec and generated SDK
- [x] Fastify server (auth, content, attempts, progress, deterministic hints)
- [x] Web app shell, Home, Learn, and Progress
- [x] Challenge Workspace (CodeMirror editor + HUD + runtime)
- [x] Variables vertical slice end to end
- [x] First Gauntlet QA pass with desktop/mobile/browser-runtime checks
- [ ] Transfer challenge and short concept check
- [ ] Anonymous-to-account progress merge
- [ ] Projects, Interview, and Knowledge reuse slices

## Last Session Summary

Implemented and adversarially reviewed the first production-quality Learn slice. The deterministic loop recognizes incomplete code, observes semantic progress, keeps Run ungraded, evaluates Check freshly, advances reviewed hints, and persists anonymous drafts/completions. `pnpm check` is the complete local gate. Next: add the transfer challenge and concept check required to measure comprehension, then prove workspace reuse in thin Projects and Interview slices.
