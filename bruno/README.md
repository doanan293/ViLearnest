# ANDV LMS API Bruno Collection

This collection contains local-first smoke, workflow, and API-contract checks for the Fastify backend.

Start the backend before running any Bruno command:

```bash
npm run dev --workspace=@andv-lms/backend
```

## Command Guide

| Command | Purpose | Requires |
| --- | --- | --- |
| `npm run test:api` | Quick smoke and unauthenticated contract checks | Local backend |
| `npm run test:api:full` | Authenticated user, admin, course-player, and real storage workflow | Local backend, database, storage environment |
| `npm run test:api:payment` | Stripe checkout and signed webhook workflow | Local backend, database, Stripe test environment |
| `npm run test:api:coverage` | Edge, auth lifecycle, and route coverage hardening | Local backend and database |

## CLI Full Run

Use the CLI when you want a repeatable full verification from the terminal. Start the backend first, then run all public Bruno commands in this order:

```bash
npm run test:api
npm run test:api:full
npm run test:api:payment
npm run test:api:coverage
```

The CLI runners handle seed, storage checks, payment checks, signed webhook runtime export, and auth lifecycle OTP export automatically.

## Bruno Desktop Full Run

Use Bruno Desktop when you want to inspect and run the full API workflow interactively. Configure the backend `.env` with the same database, storage, and Stripe test values required by the CLI workflows, plus the local-only helper gate:

```text
BRUNO_DESKTOP_HELPERS_ENABLED=true
BRUNO_DESKTOP_HELPER_TOKEN=bruno-desktop-local-token
```

Start or restart the backend after changing these values, open the Bruno collection, and select the `local` environment. The `local` environment already contains:

```text
brunoDesktopHelperToken: bruno-desktop-local-token
```

For a full Desktop run, run these groups in order. Re-run `desktop-helpers/seed` before each major stateful section to match the CLI runners.

1. Smoke and contracts: run `system`, `auth-contract`, `public-courses`, `protected-routes`, `admin-routes`, and `storage`.
2. Authenticated, admin, course, and storage workflows: run `desktop-helpers/seed`, then `desktop-helpers/check-storage-env`, then the ordered requests in `auth-workflows`, `user-workflows`, `course-workflows`, `storage-workflows`, and `admin-workflows`.
3. Payment workflow: run `desktop-helpers/seed`, then `desktop-helpers/check-payment-env`, then payment requests through `payment-workflows/checkout-confirm-negative`, then `desktop-helpers/export-payment-webhook-runtime`, then the remaining payment requests starting at `payment-workflows/stripe-checkout-completed-webhook`.
4. Coverage and auth lifecycle: run `desktop-helpers/seed`, then `edge-workflows`, then auth lifecycle requests through `auth-lifecycle-workflows/request-password-reset-lifecycle-user`, then `desktop-helpers/export-auth-lifecycle-otp`, then the remaining auth lifecycle requests starting at `auth-lifecycle-workflows/reset-password-lifecycle-user`.

## Smoke And Contract Checks

Run:

```bash
npm run test:api
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
npm run test:api:full
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

## Coverage Hardening

Run:

```bash
npm run test:api:coverage
```

This command seeds deterministic Bruno-owned data and runs route-hardening edge checks, Better Auth lifecycle coverage, invalid input coverage, not-enrolled course-player boundaries, and invalid Stripe webhook input checks.

Route-level Bruno coverage is tracked in:

```text
docs/testing/bruno-api-coverage.md
```

