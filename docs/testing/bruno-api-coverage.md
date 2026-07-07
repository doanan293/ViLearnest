# Bruno Backend API Coverage

This audit tracks backend HTTP API coverage for the Bruno collection.

Status values:

- `Covered`: Bruno directly exercises the route.
- `Partial`: Bruno covers the route but an important edge remains outside Bruno.
- `Not Bruno-suitable`: The behavior is better validated by unit tests, browser tests, or provider-level tests.

## Fastify System Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/openapi.json` | `backend/src/app.ts` | `system/openapi-json.bru` | A | Covered | OpenAPI document smoke check. |
| GET | `/api/v1/health` | `backend/src/routes/api/v1/index.ts` | `system/health.bru` | A | Covered | Backend health check. |

## Better Auth Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/auth/session` | `backend/src/app.ts` | `auth-lifecycle-workflows/verify-direct-auth-session.bru` | D | Covered | Direct Better Auth session compatibility route. |
| POST | `/api/auth/sign-in/email` | `backend/src/app.ts` | `auth-workflows/login-user.bru`, `auth-workflows/login-admin.bru`, `auth-lifecycle-workflows/sign-in-reset-password-lifecycle-user.bru` | B, D | Covered | Email/password login. |
| POST | `/api/auth/sign-up/email` | `backend/src/app.ts` | `auth-lifecycle-workflows/sign-up-lifecycle-user.bru` | D | Covered | Lifecycle user creation. |
| POST | `/api/auth/sign-out` | `backend/src/app.ts` | `auth-lifecycle-workflows/sign-out-lifecycle-user.bru` | D | Covered | Session invalidation. |
| POST | `/api/auth/email-otp/request-password-reset` | `backend/src/app.ts` | `auth-lifecycle-workflows/request-password-reset-lifecycle-user.bru` | D | Covered | Password reset OTP request. |
| POST | `/api/auth/email-otp/reset-password` | `backend/src/app.ts` | `auth-lifecycle-workflows/reset-password-lifecycle-user.bru` | D | Covered | Password reset with DB-exported OTP. |
| POST | `/api/auth/sign-in/social` | `backend/src/app.ts` | None | D | Not Bruno-suitable | Social OAuth depends on external browser/provider redirect. |
| GET/POST | `/api/auth/*` | `backend/src/app.ts` | Selected Better Auth endpoints listed in this table | D | Covered | The wildcard adapter is covered through deterministic email/password endpoints. |

## API V1 Auth Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/email-exists` | `backend/src/routes/api/v1/auth.routes.ts` | `auth-contract/email-exists-valid.bru`, `auth-lifecycle-workflows/email-exists-lifecycle-user.bru` | A, D | Covered | Includes validation and true result after sign-up. |
| GET | `/api/v1/auth/session` | `backend/src/routes/api/v1/auth.routes.ts` | `auth-contract/session-unauthorized.bru`, `auth-workflows/verify-user-session.bru`, `auth-workflows/verify-admin-session.bru`, `auth-lifecycle-workflows/verify-lifecycle-session.bru` | A, B, D | Covered | Unauthorized and authenticated sessions. |

## Course Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/courses` | `backend/src/routes/api/v1/courses.routes.ts` | `public-courses/list-published-courses.bru` | A | Covered | Public course list. |
| GET | `/api/v1/courses/by-slug/:slug` | `backend/src/routes/api/v1/courses.routes.ts` | `course-workflows/get-seeded-public-course.bru`, `public-courses/get-course-by-slug-not-found.bru` | A, B | Covered | Success and not found. |
| GET | `/api/v1/courses/by-slug/:slug/sidebar` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/course-sidebar-unauthorized.bru`, `course-workflows/get-seeded-sidebar.bru`, `edge-workflows/course-sidebar-not-enrolled-forbidden.bru`, `payment-workflows/payment-course-sidebar.bru` | A, B, C, D | Covered | Unauthorized, enrolled, not enrolled, and paid unlock. |
| GET | `/api/v1/courses/lessons/:lessonId` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/lesson-content-unauthorized.bru`, `course-workflows/get-seeded-lesson-content.bru`, `course-workflows/get-missing-lesson-content.bru`, `edge-workflows/lesson-content-not-enrolled-forbidden.bru`, `payment-workflows/payment-course-lesson-content.bru` | A, B, C, D | Covered | Unauthorized, active enrollment, not found, not enrolled, and paid unlock. |
| GET | `/api/v1/courses/enrolled` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/enrolled-courses-unauthorized.bru`, `course-workflows/list-enrolled-courses.bru`, `payment-workflows/payment-course-in-enrolled-list.bru` | A, B, C | Covered | Unauthorized and authenticated. |
| GET | `/api/v1/courses/:courseId/is-enrolled` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/is-enrolled-unauthorized.bru`, `course-workflows/check-seeded-is-enrolled.bru`, `payment-workflows/payment-course-not-enrolled.bru`, `payment-workflows/payment-course-enrolled.bru` | A, B, C | Covered | Unauthorized, true, false, and post-payment true. |
| POST | `/api/v1/courses/enroll` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/enroll-unauthorized.bru`, `payment-workflows/enroll-payment-course.bru`, `edge-workflows/course-enroll-invalid-body.bru` | A, C, E | Covered | Unauthorized, invalid body, and real Stripe test-mode checkout creation. |
| POST | `/api/v1/courses/checkout/confirm` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/checkout-confirm-unauthorized.bru`, `payment-workflows/checkout-confirm-negative.bru`, `edge-workflows/checkout-confirm-invalid-body.bru` | A, C, E | Covered | Unauthorized, invalid body, and controlled unpaid-session failure. |
| POST | `/api/v1/courses/lesson/complete` | `backend/src/routes/api/v1/courses.routes.ts` | `protected-routes/lesson-complete-unauthorized.bru`, `course-workflows/complete-seeded-lesson.bru`, `course-workflows/get-seeded-lesson-after-complete.bru`, `edge-workflows/lesson-complete-invalid-body.bru` | A, B, E | Covered | Unauthorized, invalid body, and progress update. |

## Profile Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/profile/me` | `backend/src/routes/api/v1/profile.routes.ts` | `protected-routes/profile-me-unauthorized.bru`, `user-workflows/get-profile-me.bru` | A, B | Covered | Unauthorized and authenticated read. |
| PUT | `/api/v1/profile/me` | `backend/src/routes/api/v1/profile.routes.ts` | `protected-routes/profile-update-unauthorized.bru`, `user-workflows/update-profile-valid.bru`, `user-workflows/update-profile-invalid-phone.bru` | A, B | Covered | Unauthorized, valid update, and validation. |

## Admin Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/dashboard/stats` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/dashboard-stats-unauthorized.bru`, `edge-workflows/user-forbidden-admin-dashboard-stats.bru`, `admin-workflows/dashboard-stats.bru` | A, B, E | Covered | Unauthorized, user forbidden, and admin success. |
| GET | `/api/v1/admin/dashboard/enrollment-stats` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/dashboard-enrollment-stats-unauthorized.bru`, `admin-workflows/dashboard-enrollment-stats.bru` | A, B | Covered | Unauthorized and admin success. |
| GET | `/api/v1/admin/courses/recent` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/courses-recent-unauthorized.bru`, `edge-workflows/user-forbidden-admin-recent-courses.bru`, `edge-workflows/admin-list-recent-courses.bru` | A, D, E | Covered | Unauthorized, user forbidden, and admin success. |
| GET | `/api/v1/admin/courses` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/courses-list-unauthorized.bru`, `admin-workflows/user-forbidden-admin-courses.bru`, `admin-workflows/find-created-course.bru` | A, B | Covered | Unauthorized, user forbidden, and admin list. |
| POST | `/api/v1/admin/courses` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/course-create-unauthorized.bru`, `edge-workflows/user-forbidden-admin-create-course.bru`, `admin-workflows/create-course.bru`, `edge-workflows/admin-create-course-invalid-body.bru` | A, B, D, E | Covered | Unauthorized, user forbidden, valid create, and invalid body. |
| GET | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/course-detail-unauthorized.bru`, `admin-workflows/get-created-course.bru`, `admin-workflows/missing-created-course-after-delete.bru` | A, B | Covered | Unauthorized, success, and missing after delete. |
| PUT | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/course-update-unauthorized.bru`, `admin-workflows/update-course.bru`, `edge-workflows/admin-update-missing-course.bru` | A, B, D | Covered | Unauthorized, success, and missing resource. |
| DELETE | `/api/v1/admin/courses/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/course-delete-unauthorized.bru`, `admin-workflows/delete-created-course.bru` | A, B | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/courses/:courseId/chapters` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/chapter-create-unauthorized.bru`, `admin-workflows/create-chapter.bru`, `edge-workflows/admin-create-chapter-missing-course.bru` | A, B, D | Covered | Unauthorized, success, and missing course. |
| DELETE | `/api/v1/admin/chapters/:chapterId` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/chapter-delete-unauthorized.bru`, `admin-workflows/delete-created-chapter.bru` | A, B | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/chapters/reorder` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/chapters-reorder-unauthorized.bru`, `admin-workflows/reorder-chapters.bru`, `edge-workflows/admin-reorder-chapters-empty.bru` | A, B, D | Covered | Unauthorized, success, and empty input. |
| POST | `/api/v1/admin/chapters/:chapterId/lessons` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/lesson-create-unauthorized.bru`, `edge-workflows/user-forbidden-admin-create-lesson.bru`, `admin-workflows/create-lesson.bru`, `edge-workflows/admin-create-lesson-invalid-body.bru` | A, B, E | Covered | Unauthorized, user forbidden, success, and invalid body. |
| GET | `/api/v1/admin/lessons/:id` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/lesson-detail-unauthorized.bru`, `admin-workflows/get-created-lesson.bru` | A, B | Covered | Unauthorized and success. |
| PUT | `/api/v1/admin/lessons/:lessonId` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/lesson-update-unauthorized.bru`, `admin-workflows/update-lesson.bru`, `edge-workflows/admin-update-missing-lesson.bru`, `edge-workflows/admin-update-lesson-invalid-body.bru` | A, B, D, E | Covered | Unauthorized, success, missing resource, and invalid body. |
| DELETE | `/api/v1/admin/lessons/:lessonId` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/lesson-delete-unauthorized.bru`, `admin-workflows/delete-created-lesson.bru` | A, B | Covered | Unauthorized and success. |
| POST | `/api/v1/admin/lessons/reorder` | `backend/src/routes/api/v1/admin.routes.ts` | `admin-routes/lessons-reorder-unauthorized.bru`, `admin-workflows/reorder-lessons.bru`, `edge-workflows/admin-reorder-lessons-empty.bru` | A, B, D | Covered | Unauthorized, success, and empty input. |
| GET | `/api/v1/admin/users/` | `backend/src/routes/api/v1/admin-users.routes.ts` | `admin-routes/users-list-unauthorized.bru`, `admin-workflows/list-users.bru` | A, B | Covered | Unauthorized and admin success. |
| GET | `/api/v1/admin/users/:userId/profile` | `backend/src/routes/api/v1/admin-users.routes.ts` | `admin-routes/user-profile-detail-unauthorized.bru`, `admin-workflows/get-bruno-user-profile.bru` | A, B | Covered | Unauthorized and admin success. |
| PUT | `/api/v1/admin/users/:userId/profile` | `backend/src/routes/api/v1/admin-users.routes.ts` | `admin-routes/user-profile-update-unauthorized.bru`, `edge-workflows/user-forbidden-admin-update-user-profile.bru`, `edge-workflows/admin-update-user-profile-valid.bru`, `edge-workflows/admin-update-user-profile-invalid-phone.bru` | A, D, E | Covered | Unauthorized, user forbidden, valid admin-managed update, and validation. |

## Storage Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/storage/presigned` | `backend/src/routes/api/v1/storage.routes.ts` | `storage/presigned-unauthorized.bru`, `storage-workflows/presign-upload-smoke.bru`, `storage-workflows/presign-course-cover.bru`, `storage-workflows/presign-lesson-thumbnail.bru`, `storage-workflows/presign-lesson-video.bru`, `edge-workflows/storage-presigned-invalid-body.bru` | A, B, D | Covered | Unauthorized, real presigned uploads, and invalid body. |
| DELETE | `/api/v1/storage/files` | `backend/src/routes/api/v1/storage.routes.ts` | `storage/delete-file-unauthorized.bru`, `storage-workflows/delete-upload-smoke.bru`, `storage-workflows/delete-course-cover.bru`, `storage-workflows/delete-lesson-thumbnail.bru`, `storage-workflows/delete-lesson-video.bru`, `edge-workflows/storage-delete-invalid-body.bru` | A, B, D | Covered | Unauthorized, real delete, and invalid body. |

## Webhook Routes

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/webhooks/stripe` | `backend/src/routes/api/v1/webhook.routes.ts` | `payment-workflows/stripe-checkout-completed-webhook.bru`, `edge-workflows/webhook-empty-body.bru`, `edge-workflows/webhook-invalid-signature.bru` | C, D | Covered | Signed happy path, empty body, and invalid signature. |

## Bruno Desktop Helper Routes

These routes are local-only automation helpers. They are registered only when `BRUNO_DESKTOP_HELPERS_ENABLED=true` and require `x-bruno-helper-token`.

| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/bruno-desktop/seed` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `desktop-helpers/seed.bru` | Desktop | Covered | Resets and seeds Bruno-owned local data for Desktop runs. |
| GET | `/api/v1/bruno-desktop/storage-env` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `desktop-helpers/check-storage-env.bru` | Desktop | Covered | Validates local storage configuration before Desktop storage workflows. |
| GET | `/api/v1/bruno-desktop/payment-env` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `desktop-helpers/check-payment-env.bru` | Desktop | Covered | Validates local Stripe test configuration before Desktop payment workflows. |
| POST | `/api/v1/bruno-desktop/payment-webhook-runtime` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `desktop-helpers/export-payment-webhook-runtime.bru` | Desktop | Covered | Exports signed Stripe webhook runtime variables for Desktop payment workflows. |
| POST | `/api/v1/bruno-desktop/auth-lifecycle-otp` | `backend/src/routes/api/v1/bruno-desktop.routes.ts` | `desktop-helpers/export-auth-lifecycle-otp.bru` | Desktop | Covered | Exports Better Auth lifecycle OTP runtime variables for Desktop lifecycle workflows. |
