import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const edgeRequests = [
  "12-edge-workflows/02-login-user.bru",
  "07-user-workflows/04-verify-user-session.bru",
  "12-edge-workflows/03-course-sidebar-not-enrolled-forbidden.bru",
  "12-edge-workflows/04-lesson-content-not-enrolled-forbidden.bru",
  "12-edge-workflows/05-course-enroll-invalid-body.bru",
  "12-edge-workflows/06-checkout-confirm-invalid-body.bru",
  "12-edge-workflows/07-lesson-complete-invalid-body.bru",
  "12-edge-workflows/08-user-forbidden-admin-courses.bru",
  "12-edge-workflows/09-user-forbidden-admin-dashboard-stats.bru",
  "12-edge-workflows/10-user-forbidden-admin-recent-courses.bru",
  "12-edge-workflows/11-user-forbidden-admin-create-course.bru",
  "12-edge-workflows/12-user-forbidden-admin-create-lesson.bru",
  "12-edge-workflows/13-user-forbidden-admin-update-user-profile.bru",
  "12-edge-workflows/14-login-admin.bru",
  "12-edge-workflows/15-verify-admin-session.bru",
  "12-edge-workflows/16-admin-list-recent-courses.bru",
  "12-edge-workflows/17-admin-create-lesson-invalid-body.bru",
  "12-edge-workflows/18-admin-update-lesson-invalid-body.bru",
  "12-edge-workflows/19-admin-update-user-profile-valid.bru",
  "12-edge-workflows/20-admin-update-user-profile-invalid-phone.bru",
  "12-edge-workflows/21-admin-reorder-chapters-empty.bru",
  "12-edge-workflows/22-admin-reorder-lessons-empty.bru",
  "12-edge-workflows/23-admin-create-chapter-missing-course.bru",
  "12-edge-workflows/24-admin-update-missing-course.bru",
  "12-edge-workflows/25-admin-update-missing-lesson.bru",
  "12-edge-workflows/26-admin-create-course-invalid-body.bru",
  "12-edge-workflows/27-storage-presigned-invalid-body.bru",
  "12-edge-workflows/28-storage-delete-invalid-body.bru",
  "12-edge-workflows/29-webhook-empty-body.bru",
  "12-edge-workflows/30-webhook-invalid-signature.bru",
];

const authLifecyclePreOtpRequests = [
  "13-auth-lifecycle-workflows/02-sign-up-lifecycle-user.bru",
  "13-auth-lifecycle-workflows/03-email-exists-lifecycle-user.bru",
  "13-auth-lifecycle-workflows/04-request-password-reset-lifecycle-user.bru",
];

const authLifecyclePostOtpRequests = [
  "13-auth-lifecycle-workflows/06-reset-password-lifecycle-user.bru",
  "13-auth-lifecycle-workflows/07-sign-in-reset-password-lifecycle-user.bru",
  "13-auth-lifecycle-workflows/08-verify-direct-auth-session.bru",
  "13-auth-lifecycle-workflows/09-verify-lifecycle-session.bru",
  "13-auth-lifecycle-workflows/10-sign-out-lifecycle-user.bru",
  "13-auth-lifecycle-workflows/11-session-after-lifecycle-sign-out.bru",
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
