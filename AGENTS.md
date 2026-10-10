# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo. Root scripts coordinate `backend` and `frontend`.

`backend/` contains the Fastify API. Use `backend/src` for source, `src/controllers/api/v1` and `src/routes/api/v1` for HTTP flow, `src/services` for business logic, `src/db` for data access, and `backend/drizzle` for migrations. Backend unit tests live in `backend/tests/unit`; PostgreSQL regressions live in `backend/tests/integration`; shared DB fixtures live in `backend/tests/support`.

`frontend/` contains the Next.js app. App Router pages are in `src/app`, domain code in `src/features`, shared UI in `src/components`, utilities and API clients in `src/lib`, and tests in `frontend/tests`. `bruno/` stores HTTP smoke/business collections and standalone tooling/tests; `docs/` stores plans, specs, and reports.

## Build, Test, and Development Commands

- `npm install`: install workspace dependencies.
- `npm run dev`: start backend and frontend servers.
- `npm run build`: run workspace build/type-check scripts.
- `npm run check`: run Biome checks across workspaces.
- `npm run test`: run Jest unit suites for FE, BE and Bruno tooling. DB integration and browser/API checks run separately.
- `npm run test:api`: run Bruno API checks; start the backend and database first.
- `npm run db:generate` / `npm run db:migrate`: generate and apply Drizzle migrations.

## Coding Style & Naming Conventions

Use TypeScript with strict typing. Biome is the formatter and linter. Backend formatting uses 2 spaces, 120-column lines, double quotes, and semicolons. Frontend formatting uses tabs, 100-column lines, double quotes, and semicolons.

Use PascalCase for React components, `useX` for hooks, and descriptive file names matching the feature or route. Prefer frontend imports through `@/` and keep reusable logic in `src/features` or `src/lib`.

## Testing Guidelines

Jest is used in both workspaces. Backend Jest tests use Node with `ts-jest` ESM and should be named `*.test.ts` under `backend/tests/unit` or `backend/tests/integration`. Frontend tests use jsdom and Testing Library; place `*.test.*` or `*.spec.*` files under `frontend/tests`.

For targeted runs, use workspace commands such as `npm run test --workspace=@andv-lms/frontend` or `npm run test --workspace=@andv-lms/backend`. Add regression tests for behavior changes, API contracts, and UI state transitions.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit-style prefixes such as `feat:`, `docs:`, and `chore:`. Keep subjects imperative and specific, for example `feat: add responsive course image sizes`.

Pull requests should summarize changes, list verification commands, note migrations or environment changes, link issues when available, and include screenshots for visible UI changes.

## Security & Configuration Tips

Keep `backend/.env` and `frontend/.env` local; `.env*` files are ignored. Do not commit secrets, API keys, Stripe webhook values, database URLs, or S3 credentials. Document any new required variables in README or PR notes.

## Testing Boundaries

Keep code and documentation in the four root directories `frontend`, `backend`, `bruno`, and `docs`. Root config files coordinate the monorepo. Put scripts under their owner, never a root `scripts` or `tests` directory.

Product code must not import tests or Bruno. Backend tests/support must not import Bruno. Bruno tooling may consume backend test support. Frontend must communicate with backend through HTTP, including browser tests; E2E setup invokes the backend fixture CLI in a separate process.

- `npm run test:integration`: BE PostgreSQL regressions; requires isolated `TEST_DATABASE_URL`.
- `npm run test:bruno:integration`: helper integration; same database requirement.
- `npm run test:e2e:install`: install Playwright Chromium.
- `npm run test:e2e`: browser journeys; owns FE/BE servers on ports 3002/5002 and requires migrated test DB.
- `npm run test:api:smoke` / `test:api:core`: Bruno against running API/helper.
- `npm run check:all`: product checks, architecture import boundaries and Bruno tooling checks.
- `npm run typecheck:tests --workspace=@andv-lms/backend` / `npm run typecheck:bruno:tests`: strict test type checks.

Browser E2E lives under `frontend/tests/e2e/*.e2e.ts` and is excluded from Jest. Use Jest for logic/UI/DB regression, Playwright for browser journeys and Bruno for HTTP workflows. Do not add Vitest for duplicate coverage. Use UUID-scoped fixtures; never reset a development DB. E2E reports/traces are ignored local artifacts and can contain session data.
