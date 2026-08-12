# Project State — Code Trainer

## MVP

**What it does:** An editor-first coding education platform. Learners write and run real JavaScript in a reusable Code Workspace while an inline AI assistant diagnoses mistakes, gives graduated hints, and tracks skill mastery. Four pillars: Learn (guided lessons), Projects, Interview (LeetCode-style), Knowledge (quizzes).

**Users:** Single role (learner). No teacher/admin roles in V1.

**In V1 (validation and reuse slice per docs/15-16):**
- App Shell (Home, Learn, Projects, Interview, Knowledge, Progress)
- Learn content browser with guided Variables, independent transfer, a second concept, and concept checks
- Challenge Workspace: CodeMirror editor with live JS syntax highlighting + diagnostics, HUD (goal/progress/assistant), Runtime panel (output)
- Manifest-driven JavaScript execution: disposable Worker for language exercises and opaque-origin, CSP-restricted iframe for DOM exercises
- Inline assistant: deterministic, reviewed hint ladder and teaching-state policy (Level 0-4 per docs/10); optional AI conversation is a later layer
- Auth, anonymous-to-account merge, and newest-draft continuity
- Server-authoritative XP, progress, learning evidence, telemetry, and skill mastery
- Thin production-quality reuse slices for Projects, Interview, and Knowledge

**Parking lot (V2+):**
- Deeper catalogs for all four pillars
- Awards/achievements UI
- Multiple languages (language-adapter boundary exists, JS is the only implementation)
- CMS-backed curriculum (content ships as versioned YAML in this repo for V1)

**Stack:** pnpm workspaces monorepo. `apps/web` — Vite + React + TypeScript + Tailwind + **CodeMirror 6** (not Monaco — lighter, better inline-decoration API for HUD-anchored diagnostics, better mobile/keyboard support, matches doc 09's "annotations anchored to code" requirement). `apps/server` — Fastify + TypeScript, OpenAPI-first via `fastify-openapi-glue`. `packages/db` — Prisma + MySQL, **user-state only** (see Architecture Deviations). SDK — `openapi-fetch` + React Query hooks, same pattern as factory default.

**Plugins:** none from the standard plugin catalog. The validation slice has no live AI dependency; its `AssistantService` advances reviewed, authored hints deterministically.

**Assumptions:**
- Deterministic parser, evaluator, misconception, and authored-hint systems own the teaching loop. An optional future AI boundary may rephrase or deepen explanations but never determines correctness.
- Curriculum content (Track/Section/Lesson/Challenge/Check/Skill) is declarative YAML in `/content`, not database rows — matches docs/03's explicit "content portability" requirement and enables a git-reviewable, non-engineer-editable-later authoring flow.
- Browser evaluation is immediate UX feedback only. Authenticated completion is re-evaluated in a fresh, capped QuickJS WASM isolate; clients never submit pass counts or XP amounts. Reward ledger writes and anonymous merges are idempotent.

## Architecture Deviations from Factory Defaults

This is a learning-content platform, not a social CRUD app, so several defaults from `references/core-architecture.md` and `references/domain-defaults.md` don't apply as-is:

1. **Curriculum is not database rows.** `content/javascript/learn/*.yaml` holds Track/Section/Lesson/Challenge/Skill definitions, validated against `packages/content-schema` (Zod). `packages/learning-engine` loads and queries this content with pure functions — no DB access. The API still exposes curriculum-browsing routes (so the frontend never imports YAML directly, preserving the SDK-is-the-only-bridge rule) but those handlers read from `learning-engine`, not Prisma.
2. **Prisma owns only user-generated state**: identity/session, attempts, drafts, progress, evidence, telemetry, rewards, mastery, merge receipts, and question attempts. No curriculum tables are introduced.
3. **Editor, runner, and evaluators are reusable software primitives.** The browser imports them directly for responsive feedback. Authenticated `Check` also sends source and evidence metadata to the server, where an independent QuickJS evaluator decides correctness and rewards without exposing Node, network, storage, filesystem, or application credentials.
4. **Assistant correctness is deterministic.** `POST /assistant/hint` exposes the next reviewed hint without sending the complete answer ladder to the browser. Future AI conversation, if added, remains downstream of authoritative parser/runtime/evaluator state.

## Phase Completed

Phase 2 — Learning validation and architecture stress slice: guided-to-transfer-to-concept evidence loop, privacy-minimal telemetry, authoritative rewards, identity continuity, hostile DOM isolation, and all four product modes using shared contracts.

## Modules Built

- [x] Monorepo scaffold
- [x] content-schema + learning-engine + nine Learn challenges, transfer, and concept checks
- [x] language-javascript + evaluator registry and client-side runner
- [x] Prisma schema (user-state)
- [x] OpenAPI spec and generated SDK
- [x] Fastify server (auth, authoritative checks, content, drafts, merge, evidence, telemetry, progress, deterministic hints)
- [x] Web app shell and all four mode catalogs
- [x] Challenge Workspace (CodeMirror editor + HUD + runtime)
- [x] Variables vertical slice end to end
- [x] First Gauntlet QA pass with desktop/mobile/browser-runtime checks
- [x] Transfer challenge and short concept check using the same canonical skills
- [x] Anonymous-to-account evidence/draft/telemetry merge
- [x] Projects, Interview, and Knowledge reuse slices
- [x] Source-free learning telemetry and independent/hinted/failed transfer evidence
- [x] Opaque-origin DOM sandbox and server QuickJS authority

## Last Session Summary

Completed and adversarially reviewed the learning-validation and reuse slice. Variables practice now leads to an independent transfer challenge and aligned concept check. Projects and Interview reuse `ChallengeWorkspace`; Knowledge uses answer-free public projections and server-side grading. Authenticated rewards require a capped QuickJS recheck, anonymous state merges idempotently, runtime capabilities are explicit, DOM code runs in a disposable opaque-origin iframe, and requested telemetry contains no learner source. `pnpm check` is the complete local gate. Next work should be evidence-led iteration on these slices rather than expanding Learn depth by default.
