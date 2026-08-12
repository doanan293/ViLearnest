import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const preWebhookRequests = [
  "11-payment-workflows/03-login-user.bru",
  "07-user-workflows/04-verify-user-session.bru",
  "11-payment-workflows/04-payment-course-not-enrolled.bru",
  "11-payment-workflows/05-enroll-payment-course.bru",
  "11-payment-workflows/06-payment-course-still-pending.bru",
  "11-payment-workflows/07-checkout-confirm-negative.bru",
];

const postWebhookRequests = [
  "11-payment-workflows/03-login-user.bru",
  "07-user-workflows/04-verify-user-session.bru",
  "11-payment-workflows/09-stripe-checkout-completed-webhook.bru",
  "11-payment-workflows/10-payment-course-enrolled.bru",
  "11-payment-workflows/11-payment-course-in-enrolled-list.bru",
  "11-payment-workflows/12-payment-course-sidebar.bru",
  "11-payment-workflows/13-payment-course-lesson-content.bru",
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
run("npm", ["run", "bruno:check-payment-env", "--workspace=@andv-lms/backend"]);
runBru(preWebhookRequests);

const exportResult = run("npm", ["run", "bruno:export-payment-webhook", "--workspace=@andv-lms/backend"], {
  capture: true,
});
const runtimeJson = exportResult.stdout.trim().split("\n").at(-1);
const runtimeVars = JSON.parse(runtimeJson);

runBru(postWebhookRequests, runtimeVars);
