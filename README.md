# Code Trainer — public intro, setup, and developer handbook

Code Trainer is an editor-first coding education platform that gives learners a lightweight, focused environment to write and run real JavaScript while receiving deterministic, reviewed hints from an inline assistant.

This repo now includes a database-backed Content Platform and an Admin Content Studio for managing, validating, publishing, and generating challenge content.

This document is written for two audiences:
- Product users (short intro and how to run locally)
- Architects and developers taking over the project (setup, architecture, conventions, and high-value next steps)

---

## Public site intro (for users)

Code Trainer helps beginners and interview candidates learn JavaScript by doing. Key features:
- Guided Learn tracks with small, validated challenges and concept checks
- Challenge Workspace: lightweight editor (CodeMirror 6) with live JS evaluation and inline diagnostics
- Projects, Interview practice, and Knowledge checks reusing the same workspace
- Deterministic hint ladder (reviewed, authored hints) and server-authoritative grading

Try it locally:

```bash
cp .env.example .env
# set DATABASE_URL and any other env vars in .env
pnpm bootstrap
pnpm dev
```

Web UI: http://localhost:5173
API: http://localhost:3001

---

## Quick setup (developer) — first time

1. Ensure Node 20 and `pnpm` (v9+/10) are installed.
2. Copy environment file and set `DATABASE_URL` and any cloud secrets you need.

```bash
cp .env.example .env
# Edit .env to set DATABASE_URL, SESSION_SECRET, etc.
pnpm install
pnpm bootstrap
```

- `pnpm bootstrap` runs repo-specific generators, pushes Prisma schema to the DB (via `pnpm db:push`), generates SDK code, creates pages/tests, and seeds development data.
- To run locally: `pnpm dev` (starts `apps/web` and `apps/server` in parallel).

Useful commands

```text
pnpm dev            # run apps in dev mode
pnpm test           # run unit tests across the monorepo
pnpm test:e2e       # run Playwright e2e smoke tests for the web app
pnpm content:validate # validate curriculum YAML and admin content schemas
pnpm content:seed   # seed MySQL from content YAML fixtures
pnpm db:push        # sync Prisma schema to the database
pnpm sdk:generate   # regenerate SDK from OpenAPI
pnpm sdk:check      # fail if generated SDK is out-of-date
pnpm check          # full local validation gauntlet (validate, typecheck, lint, tests, build, e2e)
```

---

## System architecture (high level)

- Monorepo (pnpm workspaces) with two primary apps:
	- `apps/web` — Vite + React + TypeScript + Tailwind + CodeMirror 6. This hosts the Challenge Workspace and UI.
	- `apps/server` — Fastify + TypeScript. Serves OpenAPI endpoints for content, checks, auth, progress, telemetry, and deterministic hints.
- Packages of interest:
- `packages/content-schema` — Zod schemas and validators for declarative curriculum YAML and admin content payloads.
- `packages/learning-engine` — pure functions to query curriculum YAML and produce lesson/challenge data, plus repository abstractions for YAML and Prisma-backed content.
- `packages/language-javascript` — browser-side runner and helpers for evaluating JavaScript in a sandbox.
- `packages/evaluators` — canonical evaluators and fixtures for challenge grading.
- `packages/db` — Prisma schema and helpers for user state (progress, drafts, telemetry, rewards), plus the new content domain models and seed pipeline.
- `packages/sdk` — generated OpenAPI client used by the web app, now including admin content management hooks.

Design principles:
- Curriculum is authored in declarative YAML under `content/`, validated by `packages/content-schema`, and seeded into MySQL via a repository abstraction. The system supports both YAML-backed and DB-backed content sources.
- The server enforces authoritative grading and reward writes; the browser is a responsive UX layer that runs tentative evaluations locally for immediate feedback.
- Isolation: browser runs user code inside a disposable QuickJS or sandboxed Worker; DOM exercises use an opaque-origin iframe with CSP to limit capabilities.

CI and tests:
- GitHub Actions CI is configured in `.github/workflows/ci.yml` and runs typecheck, lint, unit tests, generated SDK validation, DB push, and e2e tests (Playwright).
- Unit tests use `vitest` and small `tsx` test scripts; e2e tests use Playwright.

---

## Code conventions and developer guidance

- Language: TypeScript across apps and packages. Keep `tsconfig` consistent (`tsconfig.base.json`).
- Validation: use `zod` for runtime schema validation in packages (content + API request/response validation).
- API surface: OpenAPI spec lives in `packages/api-spec/openapi.yaml`. Regenerate the SDK with `pnpm sdk:generate` and validate with `pnpm sdk:check`.
- Generators: the `scripts/` folder contains repo generators (page & test generators). Generated code is checked into repo to simplify review; update generators when API changes.
- Editor runtime: `apps/web` uses CodeMirror 6 and a lightweight runner; avoid introducing Monaco unless necessary.
- Admin studio: the web app includes admin content pages for `/admin/content`, `/admin/content/:id`, `/admin/content/generate`, and `/admin/taxonomy`.

Testing guidance
- Seed deterministic test data via `pnpm db:seed` (see `packages/db` seed scripts).
- Tests should be deterministic: prefer lightweight, focused unit tests for `packages/learning-engine`, `packages/language-javascript`, and `packages/evaluators`.
- E2E tests are smoke tests that validate runtime isolation and key user journeys.

Contributing code
- Follow existing code style: ESLint + Prettier rules are configured at repo-level. Run `pnpm lint` before committing.
- Add unit tests for new logic and run `pnpm test` locally.
- For schema changes (OpenAPI or curriculum YAML), update validators and run `pnpm content:validate` and `pnpm sdk:generate` as needed.