# Code Trainer

Editor-first coding education platform. See `CLAUDE.md` for project state and architecture, and `docs/` for the full product spec.

## Setup

1. Copy env: `cp .env.example .env` and fill in `DATABASE_URL`
2. Run bootstrap: `pnpm bootstrap` — installs deps, pushes schema, generates SDK + pages + tests, seeds data

## Dev

```bash
pnpm dev
```

Web: http://localhost:5173
API: http://localhost:3001

## Commands

| Command | Description |
|---|---|
| `pnpm bootstrap` | First-run: install, push schema, generate everything, seed |
| `pnpm dev` | Run all apps in dev mode |
| `pnpm sdk:generate` | Regenerate types from OpenAPI spec |
| `pnpm sdk:check` | Fail if committed types.ts has drifted from spec |
| `pnpm content:validate` | Validate all curriculum YAML against the content schema |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm test:e2e` | Run anonymous desktop/mobile browser checks |
| `pnpm check` | Run the complete local validation gauntlet |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:seed` | Seed development data |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture

Curriculum (`content/`) is declarative YAML, validated by `packages/content-schema` and queried by `packages/learning-engine` — it never touches the database. User progress (`packages/db`) is the only Prisma-backed state. The code editor, JS runner, and evaluators (`packages/language-javascript`, `packages/evaluators`) run entirely in the browser inside a Web Worker sandbox. See `CLAUDE.md` → Architecture Deviations for the full rationale.
