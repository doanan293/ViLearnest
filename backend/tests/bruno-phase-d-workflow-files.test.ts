import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const brunoRoot = join(process.cwd(), "..", "bruno");

describe("bruno phase d workflow files", () => {
  it("contains every edge workflow request file", () => {
    const files = [
      "19-admin-update-user-profile-valid.bru",
      "20-admin-update-user-profile-invalid-phone.bru",
      "03-course-sidebar-not-enrolled-forbidden.bru",
      "04-lesson-content-not-enrolled-forbidden.bru",
      "05-course-enroll-invalid-body.bru",
      "06-checkout-confirm-invalid-body.bru",
      "07-lesson-complete-invalid-body.bru",
      "09-user-forbidden-admin-dashboard-stats.bru",
      "10-user-forbidden-admin-recent-courses.bru",
      "11-user-forbidden-admin-create-course.bru",
      "12-user-forbidden-admin-create-lesson.bru",
      "13-user-forbidden-admin-update-user-profile.bru",
      "16-admin-list-recent-courses.bru",
      "21-admin-reorder-chapters-empty.bru",
      "22-admin-reorder-lessons-empty.bru",
      "23-admin-create-chapter-missing-course.bru",
      "24-admin-update-missing-course.bru",
      "25-admin-update-missing-lesson.bru",
      "26-admin-create-course-invalid-body.bru",
      "17-admin-create-lesson-invalid-body.bru",
      "18-admin-update-lesson-invalid-body.bru",
      "27-storage-presigned-invalid-body.bru",
      "28-storage-delete-invalid-body.bru",
      "29-webhook-empty-body.bru",
      "30-webhook-invalid-signature.bru",
    ];

    for (const file of files) {
      expect(existsSync(join(brunoRoot, "12-edge-workflows", file))).toBe(true);
    }
  });

  it("targets the registered plural Stripe webhook route in edge workflow requests", () => {
    const invalidSignature = readFileSync(
      join(brunoRoot, "12-edge-workflows", "30-webhook-invalid-signature.bru"),
      "utf8"
    );
    const emptyBody = readFileSync(join(brunoRoot, "12-edge-workflows", "29-webhook-empty-body.bru"), "utf8");

    expect(invalidSignature).toContain("{{baseUrl}}/api/v1/webhooks/stripe");
    expect(emptyBody).toContain("{{baseUrl}}/api/v1/webhooks/stripe");
    expect(invalidSignature).not.toContain("{{baseUrl}}/api/v1/webhook/stripe");
    expect(emptyBody).not.toContain("{{baseUrl}}/api/v1/webhook/stripe");
  });

  it("contains every auth lifecycle workflow request file", () => {
    const files = [
      "02-sign-up-lifecycle-user.bru",
      "03-email-exists-lifecycle-user.bru",
      "04-request-password-reset-lifecycle-user.bru",
      "06-reset-password-lifecycle-user.bru",
      "07-sign-in-reset-password-lifecycle-user.bru",
      "08-verify-direct-auth-session.bru",
      "09-verify-lifecycle-session.bru",
      "10-sign-out-lifecycle-user.bru",
      "11-session-after-lifecycle-sign-out.bru",
    ];

    for (const file of files) {
      expect(existsSync(join(brunoRoot, "13-auth-lifecycle-workflows", file))).toBe(true);
    }
  });

  it("exposes the seeded chapter id for Phase E edge workflows", () => {
    const localEnvironment = readFileSync(join(brunoRoot, "environments", "local.bru"), "utf8");

    expect(localEnvironment).toContain("seededChapterId: bruno-seeded-enrolled-chapter");
  });

  it("runs Phase D requests through the ordered runner", () => {
    const runner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-edge-lifecycle.mjs"), "utf8");

    expect(runner).toContain("12-edge-workflows/03-course-sidebar-not-enrolled-forbidden.bru");
    expect(runner).toContain("12-edge-workflows/05-course-enroll-invalid-body.bru");
    expect(runner).toContain("12-edge-workflows/06-checkout-confirm-invalid-body.bru");
    expect(runner).toContain("12-edge-workflows/07-lesson-complete-invalid-body.bru");
    expect(runner).toContain("12-edge-workflows/08-user-forbidden-admin-courses.bru");
    expect(runner).toContain("12-edge-workflows/09-user-forbidden-admin-dashboard-stats.bru");
    expect(runner).toContain("12-edge-workflows/10-user-forbidden-admin-recent-courses.bru");
    expect(runner).toContain("12-edge-workflows/11-user-forbidden-admin-create-course.bru");
    expect(runner).toContain("12-edge-workflows/12-user-forbidden-admin-create-lesson.bru");
    expect(runner).toContain("12-edge-workflows/13-user-forbidden-admin-update-user-profile.bru");
    expect(runner).toContain("12-edge-workflows/16-admin-list-recent-courses.bru");
    expect(runner).toContain("12-edge-workflows/17-admin-create-lesson-invalid-body.bru");
    expect(runner).toContain("12-edge-workflows/18-admin-update-lesson-invalid-body.bru");
    expect(runner).toContain("12-edge-workflows/30-webhook-invalid-signature.bru");
    expect(runner).toContain("13-auth-lifecycle-workflows/04-request-password-reset-lifecycle-user.bru");
    expect(runner).toContain("13-auth-lifecycle-workflows/06-reset-password-lifecycle-user.bru");
    expect(runner).toContain("13-auth-lifecycle-workflows/08-verify-direct-auth-session.bru");
    expect(runner).toContain("bruno:export-auth-lifecycle-otp");
  });
});
