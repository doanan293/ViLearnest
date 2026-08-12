# ANDV LMS API Bruno Collection

This collection contains local-first smoke, workflow, and API-contract checks for the Fastify backend.

Start the backend before running any Bruno command:

```bash
npm run dev --workspace=@andv-lms/backend
```

## Command Guide

| Command | Purpose | Requires |
| --- | --- | --- |
| `npm run test:api` | Runs all 142 collection requests sequentially | Local backend, database, storage, Stripe test environment |
| `npm run test:api:smoke` | Quick smoke and unauthenticated contract checks | Local backend |
| `npm run test:api:workflows` | Authenticated user, admin, course-player, and real storage workflow | Local backend, database, storage environment |
| `npm run test:api:payment` | Stripe checkout and signed webhook workflow | Local backend, database, Stripe test environment |
| `npm run test:api:edge` | Edge, auth lifecycle, and route coverage hardening | Local backend and database |

## CLI Full Run

Use the CLI when you want a repeatable full verification from the terminal. Start the backend first, then run:

```bash
npm run test:api
```

The CLI runners handle seed, storage checks, payment checks, signed webhook runtime export, and auth lifecycle OTP export automatically.

## Bruno Desktop Full Run

Use Bruno Desktop when you want to inspect and run the full API workflow interactively. Configure the backend `.env` with the same database, storage, and Stripe test values required by the CLI workflows, plus the local-only helper gate:

```text
BRUNO_DESKTOP_HELPERS_ENABLED=true
BRUNO_DESKTOP_HELPER_TOKEN=bruno-desktop-local-token
```

Start or restart the backend after changing these values, open the Bruno collection, and select the `local` environment.

### 🚀 1-Click Collection Runner (Recommended for Demos)

All collection folders (`01-system` to `13-auth-lifecycle-workflows`) and stateful request files are numbered sequentially to match logical dependencies (seed -> auth -> workflows -> payment -> edge -> lifecycle).

1. Select the **`local`** environment in Bruno Desktop.
2. Right-click the root collection **`ANDV LMS API`** in the sidebar.
3. Click **Run**.
4. The Runner UI tab will execute all 140+ requests sequentially from top to bottom, updating pass/fail rows line by line in real time.

## Smoke And Contract Checks

Run:

```bash
npm run test:api:smoke
```

This command runs the lightweight public, protected-route, admin-route, auth-contract, storage-authorization, and system checks. It does not seed data and does not require storage or Stripe provider credentials.

## Authenticated And Storage Workflow

Configure the backend `.env` with a working database and real S3-compatible storage values:

```text
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT_URL_S3=...
AWS_REGION=...
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=...
```

Run:

```bash
npm run test:api:workflows
```

This command seeds deterministic Bruno-owned users and course data, validates storage environment, logs in through Better Auth, uploads real fixture files through presigned URLs, creates a real admin course, and deletes the API-created course and media objects at the end.

## Payment Workflow

Configure the backend `.env` with Stripe test-mode values:

```text
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
FRONTEND_URL=...
API_BASE_URL=...
```

Run:

```bash
npm run test:api:payment
```

This command seeds deterministic Bruno-owned data, creates a real Stripe Checkout Session in test mode, sends a signed local webhook payload through the backend webhook route, and verifies that protected course access unlocks after webhook processing.

## Coverage Hardening & Edge Cases

Run:

```bash
npm run test:api:edge
```

This command seeds deterministic Bruno-owned data and runs route-hardening edge checks, Better Auth lifecycle coverage, invalid input coverage, not-enrolled course-player boundaries, and invalid Stripe webhook input checks.

Route-level Bruno coverage is tracked in:

```text
docs/testing/bruno-api-coverage.md
```

