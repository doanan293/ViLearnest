# Bruno business API tests

The collection has eight independently runnable folders: system, auth, profile, public courses, admin courses, learning access, payment and storage. Each stateful folder creates its own run-owned accounts/resources, reads back business results and cleans them up.

## Code boundaries

- `bruno/tooling`: standalone helper, fixtures, provider probes, CLI runner and coverage validator.
- `bruno/tests`: tooling unit and fixture integration tests.
- `backend/tests/integration` and `backend/tests/support`: product integration regressions and the isolated PostgreSQL harness.
- `backend/`: product code, product unit/integration tests and shared data builders. It has no Bruno routes, imports or helper settings.

## Local prerequisites

Install with `npm ci`, migrate an isolated test database and configure the local backend environment. Run the LMS backend and the helper against the same database. Export an explicit `TEST_DATABASE_URL` for integration tests; use that database as `DATABASE_URL` for both servers. Do not use a development database for these mutable suites.

Start the backend, then start the separate helper:

```sh
DATABASE_URL="$TEST_DATABASE_URL" NODE_ENV=test npm run dev --workspace=@vilearnest/backend
DATABASE_URL="$TEST_DATABASE_URL" NODE_ENV=test BRUNO_DESKTOP_HELPERS_ENABLED=true BRUNO_DESKTOP_HELPER_TOKEN=bruno-desktop-local-token npm run bruno:helper
```

The helper reads `backend/.env` for database/provider configuration, binds only `127.0.0.1:5001`, requires explicit activation and a helper token, and refuses production activation. The product runs on port 5000. Use one helper process per run store.

Core suites need the backend, database and helper. They do not preflight or contact S3/Stripe. Payment needs a real Stripe **test** secret key and webhook secret; storage needs S3-compatible test credentials/bucket configuration.

## CLI commands

```sh
npm run test:api:smoke
npm run test:api:core
npm run test:api:auth
npm run test:api:profile
npm run test:api:public-courses
npm run test:api:admin-courses
npm run test:api:learning-access
npm run test:api:payment
npm run test:api:storage
npm run test:api
npm run test:api:all
npm run test:api:coverage
```

Smoke is read-only: system/public checks plus an anonymous protected request. Core selects folders 01–06; all selects all eight. Legacy workflows/edge commands print a migration notice and run core. No command performs a global seed/reset. Each CLI folder gets a fresh UUID and its own Bruno process.

Options include `--env`, `--base-url`, `--helper-url` and `--report-dir`. The runner uses pinned CLI 3.5.0. A helper token supplied through `BRUNO_DESKTOP_HELPER_TOKEN` is passed in the process environment, never command arguments. Reports in ignored `.bruno-reports/` contain only filenames, outcomes, HTTP status and counts, plus owned RunRef/cleanup metadata. Headers, bodies, error values, OTPs and signed URLs are discarded.

## Native Desktop

Import `bruno/`, select `local`, and set `baseUrl` to `http://localhost:5000` and `helperUrl` to `http://127.0.0.1:5001`. Configure the helper token to match the standalone server. Run a complete folder from its setup request; folders never depend on another folder's credentials or fixtures. Run the collection for all eight folders in sequence. The same requests/assertions run in Desktop and CLI.

Requests declare their actor. Collection scripts clear native cookies and select only that actor's explicit Better Auth session cookie. Setup clears runtime variables before each new folder. Helper tokens accompany only helper calls; LMS sessions do not accompany presigned uploads. Desktop execution is a separate manual verification step; CLI results do not establish Desktop runtime parity.

For manual verification, run auth, profile and learning-access separately twice; then run the full collection. Check actor identities, progress isolation, valid/invalid payment access and final cleanup. Record the Desktop version and results in `docs/testing/bruno-verification.md`.

## Interrupted runs and cleanup

CLI always attempts scoped cleanup after process errors, assertion failures and SIGINT. A cleanup failure preserves the original failing exit status and prints a recovery command. After a forced termination or helper outage, restart the helper and use the retained RunRef from output or `.bruno-runs/<uuid>.<suite>.json`:

```sh
npm run test:api:cleanup -- --run-id <uuid> --suite <suite>
```

Desktop can run the folder's final cleanup request while its `runId` remains available, or use that CLI recovery command. Cleanup deletes only registered resources for that run. S3 failures remain in `remaining` for retry. Stripe open sessions are expired and owned customers deleted; historical Checkout Session records stay in `retained`, independently of cleanup failures. Repeated cleanup is safe. Stopping the CLI cannot cancel an already dispatched backend operation: after interruption, wait for pending API operations to finish and run the recovery command again. Auth/payment recovery rechecks exact run-owned accounts and provider resources; storage recovery retains and deletes its exact owned key ledger even when the manifest was previously marked cleaned.

Payment executes real test checkout initiation and synthetic signed webhook validation through the real signature verifier. It does not submit a card payment. External OAuth/browser redirects remain explicitly excluded and unverified.

## Tooling and integration checks

```sh
npm run test:bruno:tooling
npm run test:bruno:integration
npm run build:bruno
npm run check:bruno
TEST_DATABASE_URL=<isolated-test-database> npm run test:integration
npm run test:api:coverage -- --evidence .bruno-reports/evidence.json
```

The coverage inventory observes registered Fastify routes and parses actual Bruno files. It requires explicit exclusions and detects stale references and wrong methods. Without supplied execution evidence, its generated report says `not-run`. Integration tests cover atomic ordering rollback, progress authorization and concurrent payment activation using PostgreSQL.
