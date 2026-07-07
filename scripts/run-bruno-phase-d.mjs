import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const edgeRequests = [
  "auth-workflows/login-user.bru",
  "auth-workflows/verify-user-session.bru",
  "edge-workflows/course-sidebar-not-enrolled-forbidden.bru",
  "edge-workflows/lesson-content-not-enrolled-forbidden.bru",
  "edge-workflows/course-enroll-invalid-body.bru",
  "edge-workflows/checkout-confirm-invalid-body.bru",
  "edge-workflows/lesson-complete-invalid-body.bru",
  "admin-workflows/user-forbidden-admin-courses.bru",
  "edge-workflows/user-forbidden-admin-dashboard-stats.bru",
  "edge-workflows/user-forbidden-admin-recent-courses.bru",
  "edge-workflows/user-forbidden-admin-create-course.bru",
  "edge-workflows/user-forbidden-admin-create-lesson.bru",
  "edge-workflows/user-forbidden-admin-update-user-profile.bru",
  "auth-workflows/login-admin.bru",
  "auth-workflows/verify-admin-session.bru",
  "edge-workflows/admin-list-recent-courses.bru",
  "edge-workflows/admin-create-lesson-invalid-body.bru",
  "edge-workflows/admin-update-lesson-invalid-body.bru",
  "edge-workflows/admin-update-user-profile-valid.bru",
  "edge-workflows/admin-update-user-profile-invalid-phone.bru",
  "edge-workflows/admin-reorder-chapters-empty.bru",
  "edge-workflows/admin-reorder-lessons-empty.bru",
  "edge-workflows/admin-create-chapter-missing-course.bru",
  "edge-workflows/admin-update-missing-course.bru",
  "edge-workflows/admin-update-missing-lesson.bru",
  "edge-workflows/admin-create-course-invalid-body.bru",
  "edge-workflows/storage-presigned-invalid-body.bru",
  "edge-workflows/storage-delete-invalid-body.bru",
  "edge-workflows/webhook-empty-body.bru",
  "edge-workflows/webhook-invalid-signature.bru",
];

const authLifecyclePreOtpRequests = [
  "auth-lifecycle-workflows/sign-up-lifecycle-user.bru",
  "auth-lifecycle-workflows/email-exists-lifecycle-user.bru",
  "auth-lifecycle-workflows/request-password-reset-lifecycle-user.bru",
];

const authLifecyclePostOtpRequests = [
  "auth-lifecycle-workflows/reset-password-lifecycle-user.bru",
  "auth-lifecycle-workflows/sign-in-reset-password-lifecycle-user.bru",
  "auth-lifecycle-workflows/verify-direct-auth-session.bru",
  "auth-lifecycle-workflows/verify-lifecycle-session.bru",
  "auth-lifecycle-workflows/sign-out-lifecycle-user.bru",
  "auth-lifecycle-workflows/session-after-lifecycle-sign-out.bru",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? ["inherit", "pipe", "inherit"] : "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === null || result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }

  return result;
}

function runBru(requests, envVars = {}) {
  const envArgs = Object.entries(envVars).flatMap(([key, value]) => ["--env-var", `${key}=${value}`]);
  run("npx", ["bru", "run", ...requests, "--env", "local", "--bail", ...envArgs], { cwd: brunoDir });
}

run("npm", ["run", "db:seed-bruno-api", "--workspace=@andv-lms/backend"]);
runBru(edgeRequests);
runBru(authLifecyclePreOtpRequests);

const exportResult = run("npm", ["run", "bruno:export-auth-lifecycle-otp", "--workspace=@andv-lms/backend"], {
  capture: true,
});
const runtimeJson = exportResult.stdout.trim().split("\n").at(-1);
const runtimeVars = JSON.parse(runtimeJson);

runBru(authLifecyclePostOtpRequests, runtimeVars);
