# Bruno verification record

This document records the observed baseline, final automated results, recovery exercises and outstanding manual checks.

## Baseline before implementation

Observed on 2026-10-10 with dependencies installed from `package-lock.json`:

| Command | Result |
| --- | --- |
| `npm ci` | Completed; npm reported 69 dependency advisories (37 moderate, 30 high, 2 critical). |
| `npm run test` | Backend: 24 of 25 suites and 77 of 78 tests passed; `backend/tests/bruno-route-coverage.test.ts` fails because `docs/testing/bruno-api-coverage.md` is already deleted in the working tree. Frontend: 56 of 57 suites and 138 of 139 tests passed; `frontend/tests/app/performance-audit-doc.test.ts` fails because `docs/performance/ux-performance-audit.md` is already deleted in the working tree. |
| `npm run build` | Passed. |
| `npm run check` | Passed for backend and frontend. |
| `npx bru --version` | Bruno CLI 3.5.0. |
| PostgreSQL before setup | No local server was listening on the default port; `TEST_DATABASE_URL` was unset. |

An isolated, temporary PostgreSQL 16 container is used for integration checks at
`127.0.0.1:55432`, database `andv_lms_bruno_test`. Its volume is ephemeral and
is removed when the container is stopped. No development database is used.

The user's pre-existing deletion of `docs/testing/bruno-api-coverage.md` is also
preserved. No baseline collection execution was attempted because no application
database/provider credentials were validated at this stage.

## Integration harness

The root `tests/jest.integration.config.mjs` configuration requires an explicit
`TEST_DATABASE_URL` and accepts only a PostgreSQL database name that clearly
contains a `test` component. Its setup assigns that URL to `DATABASE_URL` before
application modules load. The harness owns and closes its PostgreSQL client.

Verified during Task 1:

- Unit tests reject a missing test URL and a database name without a `test`
  component (2 passed).
- Integration tests connect to the configured database and preserve an
  unrelated sentinel row when deleting a test-owned row (2 passed).
- Starting the integration runner without `TEST_DATABASE_URL` fails with the
  explicit configuration error.
- Backend Biome check passed; backend TypeScript build passed.

## Storage verification

Task 8 ran `bru run 08-storage --env local --disable-cookies --bail` against the
configured S3-compatible provider: 25/25 requests passed. The run uploaded a
text file, PNG and MP4 through presigned URLs, registered each exact key before
upload, confirmed content type, byte count and SHA-256 through authenticated
provider reads, deleted each object through the API, and confirmed provider
absence. Run cleanup completed with no remaining objects. Probe tests also
confirmed that only provider NotFound results mean absence; permission and
network errors remain failures. A simulated provider outage left the key in a
recoverable `cleaning` manifest, and a subsequent cleanup removed it.

The storage upload and delete endpoints remain authenticated by LMS session but
do not enforce per-user object ownership. This remains a separate application
policy gap; the new run-scoped Bruno helper only constrains test-fixture keys
and cleanup.

## Payment verification

Task 9 ran `bru run 07-payment --env local --disable-cookies --bail` against a
real Stripe test account: 32/32 requests passed. Bruno created a real test
customer and Checkout Session, then submitted synthetic webhook payloads with
valid Stripe signatures through the application's real signature verification.
It did not submit a card payment. The paid event activated the owned enrollment;
unpaid and malformed signed variants left access unchanged. Both learners'
access/list results and the one-time dashboard enrollment increment were read
back through the API.

Cleanup expired the open test Checkout Session and deleted the run-owned Stripe
customer. Stripe retains the expired session as provider history, so cleanup
reports its ID in `retained` and reports retryable cleanup failures separately
in `remaining`. Regression integration tests verified ownership checks,
amount conversion (`49` pending dollars to `4900` active cents), and concurrent
webhook replay without duplicate activation.

## Tooling separation requested by the user

Bruno support code and unit tests were moved out of `backend/`. The helper now runs as a separate loopback server; the product no longer registers helper routes or reads helper configuration. Storage uses the normal `uploads/<timestamp>-<filename>` key convention; the external test helper validates the run UUID embedded in each filename.

After relocation, backend and tooling builds passed, all 23 integration tests passed, and the auth and real-provider storage suites passed 22/22 and 25/25 requests against separate product/helper processes. The helper-boundary regression asserts that the product API returns 404 even with helper flags set.

## Executable coverage inventory

Task 10 validated 73 actual Fastify route registrations and 47 product/delegated operations against parsed requests and maintained scenario references. Coverage regression tests passed 12/12 across inventory/registration/auth helper suites. The generated report defaults to `not-run` unless execution evidence is explicitly supplied. Helper requests do not count as product coverage.

Added frontend-used email-existence, Better Auth client-session and email-OTP login cases passed in the independent auth suite (32/32). Active lesson content and enrollment membership checks were added to learning-access, which passed 20/20 requests after correcting the list DTO field name (`Course`).


## Final automated verification — 2026-10-10

Executed on the user-selected current `main` branch, using Node 24.15.0, pinned Bruno CLI 3.5.0, its compatible filestore parser 0.10.0, PostgreSQL 16 and separate product/helper processes on ports 5000/5001. All mutable checks used the isolated database described above. Bruno code, fixtures, provider helpers, runner, inventory and tests live under `bruno/`; product integration tests live under `tests/integration/`.

| Check | Observed result |
| --- | --- |
| `npm run test` | Backend 34/34 passed. Frontend 138/139 passed; the remaining baseline failure reads the user-deleted `docs/performance/ux-performance-audit.md`. The root command stops before tooling because of that failure. |
| `npm run test:bruno:tooling -- --runInBand` | 65/65 tests, 16 suites passed separately. |
| Explicit isolated `TEST_DATABASE_URL`, `STRIPE_WEBHOOK_SECRET=whsec_bruno_integration_test npm run test:integration -- --runInBand` | 31/31 tests, 8 suites passed. Product payment integration tests use a mocked Stripe transport and real PostgreSQL/signature verification; they are distinct from the real provider suite. |
| `npm run build` | Backend, frontend production build and tooling type check passed. Tooling type check repeated after final recovery fixes. |
| `npm run check` | Backend, frontend and external tooling/integration Biome checks passed. |
| `npm run test:api:coverage` | 73 registered routes reconciled, 47 product/delegated operations, 185 named scenarios. Explicit exclusions remain documented. |
| `npm run test:api:core` | 160/160 requests passed, cleanup remaining zero. No S3/Stripe preflight. |
| `npm run test:api:smoke` | 4/4 read-only requests passed. |

The obsolete backend documentation/substrings coverage tests were replaced by executable inventory/tooling behavior checks. Both user-deleted documents remain deleted and unstaged. No development database, production credentials or card charge was used. No schema migration was needed for the product fixes.

Independent commands passed with a fresh process/RunRef per stateful suite:

| Command suffix | Requests | Provider | Cleanup |
| --- | --- | --- | --- |
| `auth` | 32/32 | None | No remaining resources |
| `profile` | 30/30 | None | No remaining resources |
| `public-courses` | 11/11 | None | No remaining resources |
| `admin-courses` | 61/61 | None | No remaining resources |
| `learning-access` | 23/23 | None | No remaining resources |
| `payment` | 35/35 | Real Stripe test customer/Checkout Session; synthetic signed events | Customer deleted, session expired, one historical session retained |
| `storage` | 25/25 | Real S3-compatible text/PNG/MP4 PUT and authenticated reads | Byte/type/hash matched; objects absent after delete |

## Full collection repeatability and absence checks

After the final helper recovery changes, `npm run test:api` passed **220/220 requests twice**, each with new run IDs across all seven stateful folders. Both runs returned zero retryable cleanup resources. Stripe retained one expired historical session per payment run, separately from deleted customers.

Post-run verification found all ten relevant tables empty in the isolated test database (`user`, `account`, `session`, `user_profile`, `verification`, `Course`, `Chapter`, `Lesson`, `Enrollment`, `LessonProgess`). Authenticated GetObject checks confirmed all six storage keys from the two final runs were absent. Manifests for both runs recorded cleaned status. The earlier survival exercises verified that cleanup preserves unrelated data before their test sentinels were removed.

The generated coverage report was supplied with actual request results and the completed integration suite results: 185 scenarios passed, zero failed/not-run among declared scenarios. Explicitly excluded external/manual flows remain unverified. Private whitelisted suite reports, repeat-run aggregates and recovery/absence records are under ignored `.bruno-reports/`.

## Failure and interruption recovery

- A throwaway collection changed a profile assertion to expect HTTP 999. The live CLI failed; injected helper cleanup outage preserved exit 1, marked cleanup unverified and supplied a scoped recovery command. Recovery removed the run while another run's users/course and an unrelated `bruno-*` course remained. Those verification sentinels were removed afterward.
- A throwaway profile folder paused after setup. Stopping the helper and sending SIGINT to the CLI retained exit 130, stopped further folders and reported cleanup unverified. Restarting the helper and running `test:api:cleanup` with the recorded RunRef removed its fixtures.
- Regression tests reproduce setup finalization failure after DB commit and failure before initial manifest persistence. The former keeps a `preparing` manifest recoverable by RunRef; the latter inserts no DB rows. Retrying active setup preserves the ledger/business state.
- Recovery discovers auth accounts and Stripe customers/sessions created before separate tracking requests. It persists ownership before deleting DB linkage, and rejects foreign metadata.
- Client interruption cannot cancel an already dispatched HTTP handler. Repeated auth/payment recovery reconciles exact owned resources even for previously cleaned manifests. Storage keeps an exact owned key ledger and re-deletes those keys during recovery. Late-creation regressions pass.
- A real S3 exercise cleaned a tracked key, then uploaded using its still valid presigned URL, then invoked cleanup again. Authenticated provider reads confirmed the recreated object existed and was absent after recovery. This verifies recovery of an upload completing after initial cleanup.

Run recovery again after pending backend/upload operations finish. The runner emits a recovery command on interruption even when its immediate cleanup succeeds. Raw report bodies/headers, cookies, OTPs and signed URLs are discarded; only whitelisted request outcomes/counts and ownership/cleanup metadata remain in ignored `.bruno-reports/`.

## Review and specification reconciliation

An independent read-only whole-change review checked architecture, product regressions, fixture ownership, cleanup and coverage. Its five initial Important findings were reproduced and addressed: signup before tracking, checkout before tracking, first manifest persistence, setup retry ledger loss, and missing anonymous protection. Follow-up reviews identified late backend/storage completion; focused regressions and repeat recovery address these. Final focused review reported no remaining Critical or Important findings.

All eight specification business areas map to executable folders. Atomic reorder rollback/concurrent serialization and payment owner/customer/amount/replay checks map to PostgreSQL integration tests. The inventory separately requires anonymous LMS 401 checks and authenticated learner admin 403 checks. Public operations require successful coverage. Inventory defaults to `not-run`; supplied execution evidence comes from actual CLI outcomes and the completed integration run, not file presence.

## Outstanding manual verification and boundaries

Native Desktop could not be operated in this session; Desktop version and runtime parity are **unverified**. To finish the manual gate:

1. Record the installed Desktop version, import `bruno/`, choose `local`, and start the API and explicitly enabled loopback helper against the same isolated DB.
2. Configure matching `baseUrl`, `helperUrl` and helper token; provide Stripe test and S3 test configuration for provider folders.
3. Run each entire stateful folder from setup through cleanup independently; run auth/profile/learning-access twice and inspect actor IDs, B isolation and persisted readbacks.
4. Run the full collection once, checking all eight folders and final cleanup. Record failures rather than inferring Desktop parity from the CLI.
5. Interrupt a mutable folder, wait for pending requests/uploads, and invoke final cleanup or the RunRef recovery command. Confirm owned resources are absent and unrelated fixtures survive.

External OAuth/browser redirects remain explicitly excluded/unverified. Stripe test checkout initiation plus synthetic signed webhooks does not verify card payment or provider delivery. Stripe retains expired session history, which is reported separately from retryable cleanup. Per-user storage object authorization remains a separate product policy gap described above.

The [finishing-a-development-branch workflow](/home/andv/.codex/plugins/cache/openai-curated-remote/superpowers/6.4.2/skills/finishing-a-development-branch/SKILL.md) cannot certify the full repository green: its Step 1 says, “If tests fail, report the failures and stop.” The single preserved frontend documentation failure remains. The user already selected the current branch; changes remain committed locally there, with no push/PR/merge action.
