# Bruno Backend API Coverage

This audit tracks backend HTTP API coverage for the Bruno collection.

Status values:

- `Covered`: Bruno directly exercises the route.
- `Partial`: Bruno covers the route but an important edge remains outside Bruno.
- `Not Bruno-suitable`: The behavior is better validated by unit tests, browser tests, or provider-level tests.

## Fastify System Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/openapi.json` | `backend/src/app.ts` | `01-system/openapi-json.bru` | Smoke | Covered | OpenAPI document smoke check. |
| GET | `/api/v1/health` | `backend/src/routes/api/v1/index.ts` | `01-system/health.bru` | Smoke | Covered | Backend health check. |

## Better Auth Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/auth/session` | `backend/src/app.ts` | `13-auth-lifecycle-workflows/08-verify-direct-auth-session.bru` | Edge | Covered | Direct Better Auth session compatibility route. |
| POST | `/api/auth/sign-in/email` | `backend/src/app.ts` | `07-user-workflows/03-login-user.bru`, `10-admin-workflows/02-login-admin.bru`, `13-auth-lifecycle-workflows/07-sign-in-reset-password-lifecycle-user.bru` | Workflows, Edge | Covered | Email/password login. |
| POST | `/api/auth/sign-up/email` | `backend/src/app.ts` | `13-auth-lifecycle-workflows/02-sign-up-lifecycle-user.bru` | Edge | Covered | Lifecycle user creation. |
| POST | `/api/auth/sign-out` | `backend/src/app.ts` | `13-auth-lifecycle-workflows/10-sign-out-lifecycle-user.bru` | Edge | Covered | Session invalidation. |
| POST | `/api/auth/email-otp/request-password-reset` | `backend/src/app.ts` | `13-auth-lifecycle-workflows/04-request-password-reset-lifecycle-user.bru` | Edge | Covered | Password reset OTP request. |
| POST | `/api/auth/email-otp/reset-password` | `backend/src/app.ts` | `13-auth-lifecycle-workflows/06-reset-password-lifecycle-user.bru` | Edge | Covered | Password reset with DB-exported OTP. |
| POST | `/api/auth/sign-in/social` | `backend/src/app.ts` | None | Edge | Not Bruno-suitable | Social OAuth depends on external browser/provider redirect. |
| GET/POST | `/api/auth/*` | `backend/src/app.ts` | Selected Better Auth endpoints listed in this table | Edge | Covered | The wildcard adapter is covered through deterministic email/password endpoints. |

## API V1 Auth Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/email-exists` | `backend/src/routes/api/v1/auth.routes.ts` | `02-auth-contract/email-exists-valid.bru`, `13-auth-lifecycle-workflows/03-email-exists-lifecycle-user.bru` | Smoke, Edge | Covered | Includes validation and true result after sign-up. |
| GET | `/api/v1/auth/session` | `backend/src/routes/api/v1/auth.routes.ts` | `02-auth-contract/session-unauthorized.bru`, `07-user-workflows/04-verify-user-session.bru`, `10-admin-workflows/03-verify-admin-session.bru`, `13-auth-lifecycle-workflows/09-verify-lifecycle-session.bru` | Smoke, Workflows, Edge | Covered | Unauthorized and authenticated sessions. |

## Course Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/courses` | `backend/src/routes/api/v1/courses.routes.ts` | `03-public-courses/list-published-courses.bru` | Smoke | Covered | Public course list. |
| GET | `/api/v1/courses/by-slug/:slug` | `backend/src/routes/api/v1/courses.routes.ts` | `08-course-workflows/01-get-seeded-public-course.bru`, `03-public-courses/get-course-by-slug-not-found.bru` | Smoke, Workflows | Covered | Success and not found. |
| GET | `/api/v1/courses/by-slug/:slug/sidebar` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/course-sidebar-unauthorized.bru`, `08-course-workflows/04-get-seeded-sidebar.bru`, `12-edge-workflows/03-course-sidebar-not-enrolled-forbidden.bru`, `11-payment-workflows/12-payment-course-sidebar.bru` | Smoke, Workflows, Payment, Edge | Covered | Unauthorized, enrolled, not enrolled, and paid unlock. |
| GET | `/api/v1/courses/lessons/:lessonId` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/lesson-content-unauthorized.bru`, `08-course-workflows/05-get-seeded-lesson-content.bru`, `08-course-workflows/08-get-missing-lesson-content.bru`, `12-edge-workflows/04-lesson-content-not-enrolled-forbidden.bru`, `11-payment-workflows/13-payment-course-lesson-content.bru` | Smoke, Workflows, Payment, Edge | Covered | Unauthorized, active enrollment, not found, not enrolled, and paid unlock. |
| GET | `/api/v1/courses/enrolled` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/enrolled-courses-unauthorized.bru`, `08-course-workflows/02-list-enrolled-courses.bru`, `11-payment-workflows/11-payment-course-in-enrolled-list.bru` | Smoke, Workflows, Payment | Covered | Unauthorized and authenticated. |
| GET | `/api/v1/courses/:courseId/is-enrolled` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/is-enrolled-unauthorized.bru`, `08-course-workflows/03-check-seeded-is-enrolled.bru`, `11-payment-workflows/04-payment-course-not-enrolled.bru`, `11-payment-workflows/10-payment-course-enrolled.bru` | Smoke, Workflows, Payment | Covered | Unauthorized, true, false, and post-payment true. |
| POST | `/api/v1/courses/enroll` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/enroll-unauthorized.bru`, `11-payment-workflows/05-enroll-payment-course.bru`, `12-edge-workflows/05-course-enroll-invalid-body.bru` | Smoke, Payment, Edge | Covered | Unauthorized, invalid body, and real Stripe test-mode checkout creation. |
| POST | `/api/v1/courses/checkout/confirm` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/checkout-confirm-unauthorized.bru`, `11-payment-workflows/07-checkout-confirm-negative.bru`, `12-edge-workflows/06-checkout-confirm-invalid-body.bru` | Smoke, Payment, Edge | Covered | Unauthorized, invalid body, and controlled unpaid-session failure. |
| POST | `/api/v1/courses/lesson/complete` | `backend/src/routes/api/v1/courses.routes.ts` | `04-protected-routes/lesson-complete-unauthorized.bru`, `08-course-workflows/06-complete-seeded-lesson.bru`, `08-course-workflows/07-get-seeded-lesson-after-complete.bru`, `12-edge-workflows/07-lesson-complete-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, invalid body, and progress update. |

## Profile Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/profile/me` | `backend/src/routes/api/v1/profile.routes.ts` | `04-protected-routes/profile-me-unauthorized.bru`, `07-user-workflows/05-get-profile-me.bru` | Smoke, Workflows | Covered | Unauthorized and authenticated read. |
| PUT | `/api/v1/profile/me` | `backend/src/routes/api/v1/profile.routes.ts` | `04-protected-routes/profile-update-unauthorized.bru`, `07-user-workflows/06-update-profile-valid.bru`, `07-user-workflows/07-update-profile-invalid-phone.bru` | Smoke, Workflows | Covered | Unauthorized, valid update, and validation. |

## Admin Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/dashboard/stats` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/dashboard-stats-unauthorized.bru`, `12-edge-workflows/09-user-forbidden-admin-dashboard-stats.bru`, `10-admin-workflows/04-dashboard-stats.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, user forbidden, and admin success. |
| GET | `/api/v1/admin/dashboard/enrollment-stats` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/dashboard-enrollment-stats-unauthorized.bru`, `10-admin-workflows/05-dashboard-enrollment-stats.bru` | Smoke, Workflows | Covered | Unauthorized and admin success. |
| GET | `/api/v1/admin/courses/recent` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/courses-recent-unauthorized.bru`, `12-edge-workflows/10-user-forbidden-admin-recent-courses.bru`, `12-edge-workflows/16-admin-list-recent-courses.bru` | Smoke, Edge | Covered | Unauthorized, user forbidden, and admin success. |
| GET | `/api/v1/admin/courses` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/courses-list-unauthorized.bru`, `10-admin-workflows/01-user-forbidden-admin-courses.bru`, `10-admin-workflows/09-find-created-course.bru` | Smoke, Workflows | Covered | Unauthorized, user forbidden, and admin list. |
| POST | `/api/v1/admin/courses` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/course-create-unauthorized.bru`, `12-edge-workflows/11-user-forbidden-admin-create-course.bru`, `10-admin-workflows/08-create-course.bru`, `12-edge-workflows/26-admin-create-course-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, user forbidden, valid create, and invalid body. |
| GET | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/course-detail-unauthorized.bru`, `10-admin-workflows/16-get-created-course.bru`, `10-admin-workflows/22-missing-created-course-after-delete.bru` | Smoke, Workflows | Covered | Unauthorized, success, and missing after delete. |
| PUT | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/course-update-unauthorized.bru`, `10-admin-workflows/10-update-course.bru`, `12-edge-workflows/24-admin-update-missing-course.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, success, and missing resource. |
| DELETE | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/course-delete-unauthorized.bru`, `10-admin-workflows/21-delete-created-course.bru` | Smoke, Workflows | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/courses/:courseId/chapters` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/chapter-create-unauthorized.bru`, `10-admin-workflows/11-create-chapter.bru`, `12-edge-workflows/23-admin-create-chapter-missing-course.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, success, and missing course. |
| DELETE | `/api/v1/admin/chapters/:chapterId` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/chapter-delete-unauthorized.bru`, `10-admin-workflows/20-delete-created-chapter.bru` | Smoke, Workflows | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/chapters/reorder` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/chapters-reorder-unauthorized.bru`, `10-admin-workflows/12-reorder-chapters.bru`, `12-edge-workflows/21-admin-reorder-chapters-empty.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, success, and empty input. |
| POST | `/api/v1/admin/chapters/:chapterId/lessons` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/lesson-create-unauthorized.bru`, `12-edge-workflows/12-user-forbidden-admin-create-lesson.bru`, `10-admin-workflows/13-create-lesson.bru`, `12-edge-workflows/17-admin-create-lesson-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, user forbidden, success, and invalid body. |
| GET | `/api/v1/admin/lessons/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/lesson-detail-unauthorized.bru`, `10-admin-workflows/17-get-created-lesson.bru` | Smoke, Workflows | Covered | Unauthorized and success. |
| PUT | `/api/v1/admin/lessons/:lessonId` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/lesson-update-unauthorized.bru`, `10-admin-workflows/14-update-lesson.bru`, `12-edge-workflows/25-admin-update-missing-lesson.bru`, `12-edge-workflows/18-admin-update-lesson-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, success, missing resource, and invalid body. |
| DELETE | `/api/v1/admin/lessons/:lessonId` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/lesson-delete-unauthorized.bru`, `10-admin-workflows/19-delete-created-lesson.bru` | Smoke, Workflows | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/lessons/reorder` | `backend/src/routes/api/v1/admin.routes.ts` | `05-admin-routes/lessons-reorder-unauthorized.bru`, `10-admin-workflows/15-reorder-lessons.bru`, `12-edge-workflows/22-admin-reorder-lessons-empty.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, success, and empty input. |
| GET | `/api/v1/admin/users/` | `backend/src/routes/api/v1/admin-users.routes.ts` | `05-admin-routes/users-list-unauthorized.bru`, `10-admin-workflows/06-list-users.bru` | Smoke, Workflows | Covered | Unauthorized and admin success. |
| GET | `/api/v1/admin/users/:userId/profile` | `backend/src/routes/api/v1/admin-users.routes.ts` | `05-admin-routes/user-profile-detail-unauthorized.bru`, `10-admin-workflows/07-get-bruno-user-profile.bru` | Smoke, Workflows | Covered | Unauthorized and admin success. |
| PUT | `/api/v1/admin/users/:userId/profile` | `backend/src/routes/api/v1/admin-users.routes.ts` | `05-admin-routes/user-profile-update-unauthorized.bru`, `12-edge-workflows/13-user-forbidden-admin-update-user-profile.bru`, `12-edge-workflows/19-admin-update-user-profile-valid.bru`, `12-edge-workflows/20-admin-update-user-profile-invalid-phone.bru` | Smoke, Edge | Covered | Unauthorized, user forbidden, valid admin-managed update, and validation. |

## Storage Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/storage/presigned` | `backend/src/routes/api/v1/storage.routes.ts` | `06-storage/presigned-unauthorized.bru`, `09-storage-workflows/01-presign-upload-smoke.bru`, `09-storage-workflows/04-presign-course-cover.bru`, `09-storage-workflows/06-presign-lesson-thumbnail.bru`, `09-storage-workflows/08-presign-lesson-video.bru`, `12-edge-workflows/27-storage-presigned-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, real presigned uploads, and invalid body. |
| DELETE | `/api/v1/storage/files` | `backend/src/routes/api/v1/storage.routes.ts` | `06-storage/delete-file-unauthorized.bru`, `09-storage-workflows/03-delete-upload-smoke.bru`, `09-storage-workflows/10-delete-course-cover.bru`, `09-storage-workflows/11-delete-lesson-thumbnail.bru`, `09-storage-workflows/12-delete-lesson-video.bru`, `12-edge-workflows/28-storage-delete-invalid-body.bru` | Smoke, Workflows, Edge | Covered | Unauthorized, real delete, and invalid body. |

## Webhook Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/webhooks/stripe` | `backend/src/routes/api/v1/webhook.routes.ts` | `11-payment-workflows/09-stripe-checkout-completed-webhook.bru`, `12-edge-workflows/29-webhook-empty-body.bru`, `12-edge-workflows/30-webhook-invalid-signature.bru` | Payment, Edge | Covered | Signed happy path, empty body, and invalid signature. |

## Bruno Desktop Helper Routes

These routes are local-only automation helpers. They are registered only when `BRUNO_DESKTOP_HELPERS_ENABLED=true` and require `x-bruno-helper-token`.

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/bruno-desktop/seed` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `07-user-workflows/01-seed.bru`, `11-payment-workflows/01-seed.bru`, `12-edge-workflows/01-seed.bru`, `13-auth-lifecycle-workflows/01-seed.bru` | Workflows, Payment, Edge | Covered | Resets and seeds Bruno-owned local data. |
| GET | `/api/v1/bruno-desktop/storage-env` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `07-user-workflows/02-check-storage-env.bru` | Workflows | Covered | Validates local storage configuration before storage workflows. |
| GET | `/api/v1/bruno-desktop/payment-env` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `11-payment-workflows/02-check-payment-env.bru` | Payment | Covered | Validates local Stripe test configuration before payment workflows. |
| POST | `/api/v1/bruno-desktop/payment-webhook-runtime` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `11-payment-workflows/08-export-payment-webhook-runtime.bru` | Payment | Covered | Exports signed Stripe webhook runtime variables for payment workflows. |
| POST | `/api/v1/bruno-desktop/auth-lifecycle-otp` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `13-auth-lifecycle-workflows/05-export-auth-lifecycle-otp.bru` | Edge | Covered | Exports Better Auth lifecycle OTP runtime variables for lifecycle workflows. |
