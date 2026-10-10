# Bruno business coverage

This report separates declared scenario coverage from observed execution. A `not-run` status means no run evidence was supplied to the generator.

Generated: 2026-10-10

| Registered operation | Access | Scenarios and last supplied execution evidence |
| --- | --- | --- |
| `DELETE /api/v1/admin/chapters/:chapterId` | admin | 05-admin-courses/19-delete-chapter (bruno; passed)<br>05-admin-courses/23-delete-fixture-chapter (bruno; passed)<br>05-admin-courses/36-LEARN-denied-delete-chapter (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-delete-admin-chapters-chapterId (bruno; passed) |
| `DELETE /api/v1/admin/courses/:id` | admin | 05-admin-courses/21-delete-created-course (bruno; passed)<br>05-admin-courses/25-delete-fixture-course (bruno; passed)<br>05-admin-courses/34-LEARN-denied-delete-course (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-delete-admin-courses-id (bruno; passed) |
| `DELETE /api/v1/admin/lessons/:lessonId` | admin | 05-admin-courses/41-LEARN-denied-delete-lesson (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-delete-admin-lessons-lessonId (bruno; passed) |
| `DELETE /api/v1/storage/files` | session | 08-storage/07-STORAGE-auth-delete-anonymous (bruno; passed)<br>08-storage/07-STORAGE-delete-text (bruno; passed)<br>08-storage/08-STORAGE-validation-empty-delete-key (bruno; passed)<br>08-storage/14-STORAGE-delete-image (bruno; passed)<br>08-storage/20-STORAGE-delete-video (bruno; passed) |
| `GET /api/auth/*` | public | Excluded: Better Auth dispatch adapter; concrete application-used operations are inventoried separately |
| `GET /api/auth/callback/:provider` | public | Excluded: OAuth redirect/provider flow requires external provider credentials and browser validation; separately unverified |
| `GET /api/auth/get-session` | session | 02-auth/23-AUTH-client-session (bruno; passed)<br>02-auth/54-AUTH-client-session-anonymous (bruno; passed) |
| `GET /api/auth/session` | session | 02-auth/52-AUTH-direct-session-anonymous (bruno; passed) |
| `GET /api/v1/admin/courses` | admin | 05-admin-courses/04-find-created-course (bruno; passed)<br>05-admin-courses/30-LEARN-denied-list (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-courses (bruno; passed) |
| `GET /api/v1/admin/courses/:id` | admin | 05-admin-courses/05-read-created-course (bruno; passed)<br>05-admin-courses/08-read-updated-course (bruno; passed)<br>05-admin-courses/15-read-order (bruno; passed)<br>05-admin-courses/20-read-after-chapter-delete (bruno; passed)<br>05-admin-courses/22-read-deleted-course (bruno; passed)<br>05-admin-courses/31-LEARN-denied-read (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-courses-id (bruno; passed) |
| `GET /api/v1/admin/courses/recent` | admin | 05-admin-courses/17-recent-membership (bruno; passed)<br>05-admin-courses/29-LEARN-denied-recent (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-courses-recent (bruno; passed) |
| `GET /api/v1/admin/dashboard/enrollment-stats` | admin | 05-admin-courses/28-LEARN-denied-enrollment-stats (bruno; passed)<br>07-payment/03-enrollment-stats-before (bruno; passed)<br>07-payment/30-enrollment-stats-after (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-dashboard-enrollment-stats (bruno; passed) |
| `GET /api/v1/admin/dashboard/stats` | admin | 05-admin-courses/02-stats-before (bruno; passed)<br>05-admin-courses/16-stats-after (bruno; passed)<br>05-admin-courses/21-stats-after-delete (bruno; passed)<br>05-admin-courses/27-LEARN-denied-dashboard-stats (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-dashboard-stats (bruno; passed) |
| `GET /api/v1/admin/lessons/:id` | admin | 05-admin-courses/24-read-deleted-lesson (bruno; passed)<br>05-admin-courses/39-LEARN-denied-read-lesson (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-admin-lessons-id (bruno; passed) |
| `GET /api/v1/admin/users` | admin | 03-profile/30-PROFILE-admin-anon-list (bruno; passed)<br>03-profile/33-PROFILE-admin-learner-list (bruno; passed)<br>03-profile/38-PROFILE-admin-list (bruno; passed) |
| `GET /api/v1/admin/users/:userId/profile` | admin | 03-profile/31-PROFILE-admin-anon-read (bruno; passed)<br>03-profile/34-PROFILE-admin-learner-read (bruno; passed)<br>03-profile/39-PROFILE-admin-isolation-read-a (bruno; passed)<br>03-profile/39-PROFILE-admin-protected-fields (bruno; passed)<br>03-profile/40-PROFILE-admin-missing-read (bruno; passed) |
| `GET /api/v1/auth/session` | session | 02-auth/22-AUTH-session (bruno; passed)<br>02-auth/51-AUTH-session-replay (bruno; passed)<br>02-auth/52-AUTH-session-anonymous (bruno; passed) |
| `GET /api/v1/courses` | public | 01-system/public-courses (bruno; passed)<br>04-public-courses/10-PUBLIC-visibility (bruno; passed) |
| `GET /api/v1/courses/:courseId/is-enrolled` | session | 07-payment/05-PAYMENT-pending-state (bruno; passed)<br>07-payment/20-PAYMENT-pending-preserved (bruno; passed)<br>07-payment/24-PAYMENT-enrolled-a (bruno; passed)<br>07-payment/27-PAYMENT-enrolled-isolation (bruno; passed)<br>07-payment/80-AUTH-anonymous-get-courses-courseId-is-enrolled (bruno; passed) |
| `GET /api/v1/courses/by-slug/:slug` | public | 04-public-courses/11-PUBLIC-detail (bruno; passed)<br>04-public-courses/12-PUBLIC-hidden-draft (bruno; passed)<br>04-public-courses/13-PUBLIC-hidden-archived (bruno; passed)<br>04-public-courses/21-PUBLIC-transition-visible (bruno; passed)<br>04-public-courses/23-PUBLIC-transition-hidden (bruno; passed)<br>06-learning-access/14-LEARN-access-archived-public (bruno; passed) |
| `GET /api/v1/courses/by-slug/:slug/sidebar` | session | 06-learning-access/10-LEARN-access-active (bruno; passed)<br>06-learning-access/11-LEARN-access-pending (bruno; passed)<br>06-learning-access/13-LEARN-access-archived-active (bruno; passed)<br>06-learning-access/22-LEARN-progress-read-a (bruno; passed)<br>06-learning-access/23-LEARN-isolation (bruno; passed)<br>07-payment/06-PAYMENT-pending-content-denied (bruno; passed)<br>06-learning-access/80-AUTH-anonymous-get-courses-by-slug-slug-sidebar (bruno; passed) |
| `GET /api/v1/courses/enrolled` | session | 05-admin-courses/26-learner-enrollment-after-delete (bruno; passed)<br>06-learning-access/18-LEARN-enrolled-membership (bruno; passed)<br>07-payment/25-PAYMENT-enrolled-list-a (bruno; passed)<br>07-payment/28-PAYMENT-enrolled-list-b (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-get-courses-enrolled (bruno; passed) |
| `GET /api/v1/courses/lessons/:lessonId` | session | 06-learning-access/12-LEARN-access-unenrolled (bruno; passed)<br>06-learning-access/15-LEARN-lesson-active (bruno; passed)<br>06-learning-access/16-LEARN-lesson-pending (bruno; passed)<br>06-learning-access/17-LEARN-lesson-missing (bruno; passed)<br>06-learning-access/80-AUTH-anonymous-get-courses-lessons-lessonId (bruno; passed) |
| `GET /api/v1/health` | public | 01-system/health (bruno; passed) |
| `GET /api/v1/profile/me` | session | 03-profile/11-PROFILE-self-read (bruno; passed)<br>03-profile/14-PROFILE-invalid-preserves-state (bruno; passed)<br>03-profile/16-PROFILE-null-readback (bruno; passed)<br>03-profile/18-PROFILE-self-target-preserves-state (bruno; passed)<br>03-profile/21-PROFILE-isolation-read-b (bruno; passed)<br>03-profile/80-AUTH-anonymous-get-profile-me (bruno; passed) |
| `GET /docs` | session | Excluded: Generated Swagger documentation route |
| `GET /docs/json` | session | Excluded: Generated Swagger documentation route |
| `GET /docs/static/*` | session | Excluded: Generated Swagger documentation route |
| `GET /docs/static/index.html` | session | Excluded: Generated Swagger documentation route |
| `GET /docs/static/swagger-initializer.js` | session | Excluded: Generated Swagger documentation route |
| `GET /docs/yaml` | session | Excluded: Generated Swagger documentation route |
| `GET /openapi.json` | public | 01-system/openapi-json (bruno; passed) |
| `HEAD /api/auth/*` | public | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/auth/session` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/courses` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/courses/:id` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/courses/recent` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/dashboard/enrollment-stats` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/dashboard/stats` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/lessons/:id` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/users` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/admin/users/:userId/profile` | admin | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/auth/session` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses` | public | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses/:courseId/is-enrolled` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses/by-slug/:slug` | public | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses/by-slug/:slug/sidebar` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses/enrolled` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/courses/lessons/:lessonId` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/health` | public | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /api/v1/profile/me` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs/json` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs/static/*` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs/static/index.html` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs/static/swagger-initializer.js` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /docs/yaml` | session | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `HEAD /openapi.json` | public | Excluded: Fastify automatically creates this HEAD handler for its GET operation |
| `OPTIONS *` | session | Excluded: CORS preflight handled by framework |
| `POST /api/auth/*` | public | Excluded: Better Auth dispatch adapter; concrete application-used operations are inventoried separately |
| `POST /api/auth/email-otp/request-password-reset` | public | 02-auth/30-AUTH-request-reset (bruno; passed) |
| `POST /api/auth/email-otp/reset-password` | public | 02-auth/40-AUTH-reset (bruno; passed)<br>02-auth/41-AUTH-reset-replay (bruno; passed) |
| `POST /api/auth/email-otp/send-verification-otp` | public | 02-auth/12-AUTH-send-verification-otp (bruno; passed)<br>02-auth/44-AUTH-request-signin-otp (bruno; passed) |
| `POST /api/auth/email-otp/verify-email` | public | 02-auth/13-AUTH-wrong-verification-otp (bruno; passed)<br>02-auth/14-AUTH-verify (bruno; passed)<br>02-auth/15-AUTH-consumed-verification-otp (bruno; passed) |
| `POST /api/auth/sign-in/email` | public | 02-auth/20-AUTH-wrong-password (bruno; passed)<br>02-auth/21-AUTH-login (bruno; passed)<br>02-auth/42-AUTH-old-password (bruno; passed)<br>02-auth/43-AUTH-new-password (bruno; passed)<br>03-profile/01-login-learner-a (bruno; passed)<br>03-profile/20-PROFILE-isolation-login-b (bruno; passed)<br>03-profile/36-PROFILE-admin-login (bruno; passed)<br>04-public-courses/01-login-admin (bruno; passed)<br>05-admin-courses/01-login-admin (bruno; passed)<br>05-admin-courses/18-login-learner (bruno; passed)<br>06-learning-access/01-login-learner-a (bruno; passed)<br>06-learning-access/02-login-learner-b (bruno; passed)<br>07-payment/02-login-admin (bruno; passed)<br>07-payment/04-login-learner-a (bruno; passed)<br>07-payment/26-login-learner-b (bruno; passed)<br>08-storage/02-login-learner (bruno; passed) |
| `POST /api/auth/sign-in/email-otp` | public | 02-auth/46-AUTH-signin-otp-wrong (bruno; passed)<br>02-auth/47-AUTH-signin-otp (bruno; passed)<br>02-auth/48-AUTH-signin-otp-replay (bruno; passed) |
| `POST /api/auth/sign-in/social` | public | Excluded: OAuth redirect/provider flow requires external provider credentials and browser validation; separately unverified |
| `POST /api/auth/sign-out` | session | 02-auth/50-AUTH-logout (bruno; passed) |
| `POST /api/auth/sign-up/email` | public | 02-auth/10-AUTH-register (bruno; passed) |
| `POST /api/v1/admin/chapters/:chapterId/lessons` | admin | 05-admin-courses/11-create-lesson-a (bruno; passed)<br>05-admin-courses/12-create-lesson-b (bruno; passed)<br>05-admin-courses/38-LEARN-denied-create-lesson (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-post-admin-chapters-chapterId-lessons (bruno; passed) |
| `POST /api/v1/admin/chapters/reorder` | admin | 05-admin-courses/13-reorder-chapters (bruno; passed)<br>05-admin-courses/37-LEARN-denied-reorder-chapters (bruno; passed)<br>backend/post-api-v1-admin-chapters-reorder (backend; passed)<br>05-admin-courses/80-AUTH-anonymous-post-admin-chapters-reorder (bruno; passed) |
| `POST /api/v1/admin/courses` | admin | 05-admin-courses/03-create-course (bruno; passed)<br>05-admin-courses/32-LEARN-denied-create (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-post-admin-courses (bruno; passed) |
| `POST /api/v1/admin/courses/:courseId/chapters` | admin | 05-admin-courses/09-create-chapter-a (bruno; passed)<br>05-admin-courses/10-create-chapter-b (bruno; passed)<br>05-admin-courses/35-LEARN-denied-create-chapter (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-post-admin-courses-courseId-chapters (bruno; passed) |
| `POST /api/v1/admin/lessons/reorder` | admin | 05-admin-courses/14-reorder-lessons (bruno; passed)<br>05-admin-courses/42-LEARN-denied-reorder-lessons (bruno; passed)<br>backend/post-api-v1-admin-lessons-reorder (backend; passed)<br>05-admin-courses/80-AUTH-anonymous-post-admin-lessons-reorder (bruno; passed) |
| `POST /api/v1/auth/email-exists` | public | 02-auth/05-AUTH-email-available (bruno; passed)<br>02-auth/06-AUTH-email-validation (bruno; passed)<br>02-auth/17-AUTH-email-existing (bruno; passed) |
| `POST /api/v1/courses/checkout/confirm` | session | 07-payment/19-PAYMENT-confirm-unpaid (bruno; passed)<br>backend/post-api-v1-courses-checkout-confirm (backend; passed)<br>07-payment/80-AUTH-anonymous-post-courses-checkout-confirm (bruno; passed) |
| `POST /api/v1/courses/enroll` | session | 07-payment/07-PAYMENT-start-checkout (bruno; passed)<br>07-payment/29-PAYMENT-repeat-active-enroll (bruno; passed)<br>07-payment/80-AUTH-anonymous-post-courses-enroll (bruno; passed) |
| `POST /api/v1/courses/lesson/complete` | session | 06-learning-access/20-LEARN-progress-complete (bruno; passed)<br>06-learning-access/21-LEARN-progress-repeat (bruno; passed)<br>06-learning-access/30-LEARN-progress-denied-pending (bruno; passed)<br>06-learning-access/31-LEARN-progress-denied-unenrolled (bruno; passed)<br>06-learning-access/32-LEARN-progress-missing (bruno; passed)<br>06-learning-access/80-AUTH-anonymous-post-courses-lesson-complete (bruno; passed) |
| `POST /api/v1/storage/presigned` | session | 08-storage/02-STORAGE-auth-presign-anonymous (bruno; passed)<br>08-storage/03-STORAGE-presign-text (bruno; passed)<br>08-storage/10-STORAGE-presign-image (bruno; passed)<br>08-storage/16-STORAGE-presign-video (bruno; passed) |
| `POST /api/v1/webhooks/stripe` | signature | 07-payment/10-PAYMENT-unpaid-webhook (bruno; passed)<br>07-payment/12-PAYMENT-wrong-owner-webhook (bruno; passed)<br>07-payment/14-PAYMENT-wrong-course-webhook (bruno; passed)<br>07-payment/16-PAYMENT-missing-metadata-webhook (bruno; passed)<br>07-payment/18-PAYMENT-unknown-enrollment-webhook (bruno; passed)<br>07-payment/22-PAYMENT-paid-webhook (bruno; passed)<br>07-payment/23-PAYMENT-replay (bruno; passed)<br>backend/post-api-v1-webhooks-stripe (backend; passed) |
| `PUT /api/v1/admin/courses/:id` | admin | 04-public-courses/20-PUBLIC-transition (bruno; passed)<br>04-public-courses/22-PUBLIC-transition-unpublish (bruno; passed)<br>05-admin-courses/07-update-course (bruno; passed)<br>05-admin-courses/33-LEARN-denied-update (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-put-admin-courses-id (bruno; passed) |
| `PUT /api/v1/admin/lessons/:lessonId` | admin | 05-admin-courses/40-LEARN-denied-update-lesson (bruno; passed)<br>05-admin-courses/80-AUTH-anonymous-put-admin-lessons-lessonId (bruno; passed) |
| `PUT /api/v1/admin/users/:userId/profile` | admin | 03-profile/32-PROFILE-admin-anon-write (bruno; passed)<br>03-profile/35-PROFILE-admin-learner-write (bruno; passed)<br>03-profile/37-PROFILE-admin (bruno; passed)<br>03-profile/38-PROFILE-admin-injection (bruno; passed)<br>03-profile/41-PROFILE-admin-missing-write (bruno; passed) |
| `PUT /api/v1/profile/me` | session | 03-profile/10-PROFILE-self-update (bruno; passed)<br>03-profile/12-PROFILE-invalid-phone (bruno; passed)<br>03-profile/13-PROFILE-invalid-date (bruno; passed)<br>03-profile/15-PROFILE-clear-null (bruno; passed)<br>03-profile/17-PROFILE-self-target-rejected (bruno; passed)<br>03-profile/80-AUTH-anonymous-put-profile-me (bruno; passed) |
