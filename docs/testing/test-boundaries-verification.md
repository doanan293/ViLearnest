# Test boundaries and browser verification

## Scope

Phase 1 implements Jest + Playwright Test + Bruno with four root code/document directories. Backend integration no longer imports Bruno. Shared fixture rows and isolated DB harness belong to backend test support; Bruno keeps run manifests and provider recovery.

## Evidence

Verification uses a dedicated PostgreSQL 17 container/database named `lms_boundaries_test`, migrated using the existing migrations. Chromium is the only browser checked. No development database or live provider charge is used.

| Check | Result |
| --- | --- |
| Jest BE unit | 16 suites, 39 tests passed |
| Jest FE | 59 suites, 144 tests passed in isolated checkout |
| Jest Bruno tooling | 15 suites, 63 tests passed |
| BE integration including E2E fixture CLI | 8 suites, 18 tests passed; invalid UUID/missing DB rejected |
| Bruno integration | 3 suites, 16 tests passed with a fresh run store |
| Playwright Chromium | 3 tests passed twice, each run with fresh UUID scopes |
| BE / Bruno test typecheck | Passed |
| BE build and Bruno build | Passed |
| Next.js production build | Passed as part of both successful Playwright runs |
| Product and Bruno Biome checks / import boundaries | Passed; zero import violations |
| Bruno live smoke and core | Smoke 4/4 and core 160/160; cleanup reports zero remaining and retained rows |
| E2E runner forced shutdown | Jest regression passed after reproducing a surviving server process |

The live Bruno checks ran against a local API and a dedicated test database. The full core run covers system, authentication, profile, public courses, admin courses and learning access. Bruno's coverage inventory also validated 73 registered routes and 47 product/delegated operations; that inventory command does not itself execute requests.

## Changes exposed by browser tests

Login intentionally navigates to the localized public home; the browser test follows that behavior, then opens the dashboard and verifies the session after reload. The first browser run exposed protected server queries swallowing Next.js `notFound()` and rendering fabricated content. The narrow fix propagates 401/403/404 to not-found and network/server errors to the existing error boundary. Protected SSR uses `fetchQuery`, so authorization errors cannot be swallowed by prefetch. Four Jest regressions failed before the fix and passed afterward; browser refusal now positively checks the 404 page.

Independent review found two additional gaps. The architecture checker omitted inline TypeScript `import()` type expressions; a failing regression demonstrated the bypass, and the checker now includes both `import()` and `typeof import()` types. The E2E server wrapper started detached children that could survive Playwright's forced shutdown; a regression reproduced the surviving process, and children now stay in the Playwright process group.

## Baseline and limitations

The obsolete Jest test that required the deleted `docs/performance/ux-performance-audit.md` was removed when the document deletion was committed. The deleted `docs/testing/bruno-api-coverage.md` is superseded by the current Bruno business coverage report and inventory.

Live Stripe/S3 suites, card payment, provider webhook delivery, OAuth and Bruno Desktop have not been verified by these browser tests. The scope excludes migration changes and API contract redesign; those remain later phases. E2E uses a local test-only auth secret, dry-run Arcjet configuration and no external email/provider operation.
