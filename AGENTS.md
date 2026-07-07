# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo. Root scripts coordinate `backend` and `frontend`.

`backend/` contains the Fastify API. Use `backend/src` for source, `src/controllers/api/v1` and `src/routes/api/v1` for HTTP flow, `src/services` for business logic, `src/db` for data access, and `backend/drizzle` for migrations. Backend tests live in `backend/tests/*.test.ts`.

`frontend/` contains the Next.js app. App Router pages are in `src/app`, domain code in `src/features`, shared UI in `src/components`, utilities and API clients in `src/lib`, and tests in `frontend/tests`. `bruno/` stores API smoke tests; `docs/` stores plans, specs, and reports.

## Build, Test, and Development Commands

- `npm install`: install workspace dependencies.
- `npm run dev`: start backend and frontend servers.
- `npm run build`: run workspace build/type-check scripts.
- `npm run check`: run Biome checks across workspaces.
- `npm run test`: run all Jest test suites.
- `npm run test:api`: run Bruno API checks; start the backend and database first.
- `npm run db:generate` / `npm run db:migrate`: generate and apply Drizzle migrations.

## Coding Style & Naming Conventions

Use TypeScript with strict typing. Biome is the formatter and linter. Backend formatting uses 2 spaces, 120-column lines, double quotes, and semicolons. Frontend formatting uses tabs, 100-column lines, double quotes, and semicolons.

Use PascalCase for React components, `useX` for hooks, and descriptive file names matching the feature or route. Prefer frontend imports through `@/` and keep reusable logic in `src/features` or `src/lib`.

## Testing Guidelines

Jest is used in both workspaces. Backend tests use Node with `ts-jest` ESM and should be named `*.test.ts` under `backend/tests`. Frontend tests use jsdom and Testing Library; place `*.test.*` or `*.spec.*` files under `frontend/tests`.

For targeted runs, use workspace commands such as `npm run test --workspace=@andv-lms/frontend` or `npm run test --workspace=@andv-lms/backend`. Add regression tests for behavior changes, API contracts, and UI state transitions.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit-style prefixes such as `feat:`, `docs:`, and `chore:`. Keep subjects imperative and specific, for example `feat: add responsive course image sizes`.

Pull requests should summarize changes, list verification commands, note migrations or environment changes, link issues when available, and include screenshots for visible UI changes.

## Security & Configuration Tips

Keep `backend/.env` and `frontend/.env` local; `.env*` files are ignored. Do not commit secrets, API keys, Stripe webhook values, database URLs, or S3 credentials. Document any new required variables in README or PR notes.
