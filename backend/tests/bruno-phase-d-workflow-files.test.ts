import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const brunoRoot = join(process.cwd(), "..", "bruno");

describe("bruno phase d workflow files", () => {
  it("contains every edge workflow request file", () => {
    const files = [
      "admin-update-user-profile-valid.bru",
      "admin-update-user-profile-invalid-phone.bru",
      "course-sidebar-not-enrolled-forbidden.bru",
      "lesson-content-not-enrolled-forbidden.bru",
      "course-enroll-invalid-body.bru",
      "checkout-confirm-invalid-body.bru",
      "lesson-complete-invalid-body.bru",
      "user-forbidden-admin-dashboard-stats.bru",
      "user-forbidden-admin-recent-courses.bru",
      "user-forbidden-admin-create-course.bru",
      "user-forbidden-admin-create-lesson.bru",
      "user-forbidden-admin-update-user-profile.bru",
      "admin-list-recent-courses.bru",
      "admin-reorder-chapters-empty.bru",
      "admin-reorder-lessons-empty.bru",
      "admin-create-chapter-missing-course.bru",
      "admin-update-missing-course.bru",
      "admin-update-missing-lesson.bru",
      "admin-create-course-invalid-body.bru",
      "admin-create-lesson-invalid-body.bru",
      "admin-update-lesson-invalid-body.bru",
      "storage-presigned-invalid-body.bru",
      "storage-delete-invalid-body.bru",
      "webhook-empty-body.bru",
      "webhook-invalid-signature.bru",
    ];

    for (const file of files) {
      expect(existsSync(join(brunoRoot, "edge-workflows", file))).toBe(true);
    }
  });

  it("targets the registered plural Stripe webhook route in edge workflow requests", () => {
    const invalidSignature = readFileSync(join(brunoRoot, "edge-workflows", "webhook-invalid-signature.bru"), "utf8");
    const emptyBody = readFileSync(join(brunoRoot, "edge-workflows", "webhook-empty-body.bru"), "utf8");

    expect(invalidSignature).toContain("{{baseUrl}}/api/v1/webhooks/stripe");
    expect(emptyBody).toContain("{{baseUrl}}/api/v1/webhooks/stripe");
    expect(invalidSignature).not.toContain("{{baseUrl}}/api/v1/webhook/stripe");
    expect(emptyBody).not.toContain("{{baseUrl}}/api/v1/webhook/stripe");
  });

  it("contains every auth lifecycle workflow request file", () => {
    const files = [
      "sign-up-lifecycle-user.bru",
      "email-exists-lifecycle-user.bru",
      "request-password-reset-lifecycle-user.bru",
      "reset-password-lifecycle-user.bru",
      "sign-in-reset-password-lifecycle-user.bru",
      "verify-direct-auth-session.bru",
      "verify-lifecycle-session.bru",
      "sign-out-lifecycle-user.bru",
      "session-after-lifecycle-sign-out.bru",
    ];

    for (const file of files) {
      expect(existsSync(join(brunoRoot, "auth-lifecycle-workflows", file))).toBe(true);
    }
  });

  it("exposes the seeded chapter id for Phase E edge workflows", () => {
    const localEnvironment = readFileSync(join(brunoRoot, "environments", "local.bru"), "utf8");

    expect(localEnvironment).toContain("seededChapterId: bruno-seeded-enrolled-chapter");
  });

  it("runs Phase D requests through the ordered runner", () => {
    const runner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-phase-d.mjs"), "utf8");

    expect(runner).toContain("edge-workflows/course-sidebar-not-enrolled-forbidden.bru");
    expect(runner).toContain("edge-workflows/course-enroll-invalid-body.bru");
    expect(runner).toContain("edge-workflows/checkout-confirm-invalid-body.bru");
    expect(runner).toContain("edge-workflows/lesson-complete-invalid-body.bru");
    expect(runner).toContain("admin-workflows/user-forbidden-admin-courses.bru");
    expect(runner).toContain("edge-workflows/user-forbidden-admin-dashboard-stats.bru");
    expect(runner).toContain("edge-workflows/user-forbidden-admin-recent-courses.bru");
    expect(runner).toContain("edge-workflows/user-forbidden-admin-create-course.bru");
    expect(runner).toContain("edge-workflows/user-forbidden-admin-create-lesson.bru");
    expect(runner).toContain("edge-workflows/user-forbidden-admin-update-user-profile.bru");
    expect(runner).toContain("edge-workflows/admin-list-recent-courses.bru");
    expect(runner).toContain("edge-workflows/admin-create-lesson-invalid-body.bru");
    expect(runner).toContain("edge-workflows/admin-update-lesson-invalid-body.bru");
    expect(runner).toContain("edge-workflows/webhook-invalid-signature.bru");
    expect(runner).toContain("auth-lifecycle-workflows/request-password-reset-lifecycle-user.bru");
    expect(runner).toContain("auth-lifecycle-workflows/reset-password-lifecycle-user.bru");
    expect(runner).toContain("auth-lifecycle-workflows/verify-direct-auth-session.bru");
    expect(runner).toContain("bruno:export-auth-lifecycle-otp");
  });
});
