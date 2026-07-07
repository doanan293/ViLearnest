import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const preWebhookRequests = [
  "auth-workflows/login-user.bru",
  "auth-workflows/verify-user-session.bru",
  "payment-workflows/payment-course-not-enrolled.bru",
  "payment-workflows/enroll-payment-course.bru",
  "payment-workflows/payment-course-still-pending.bru",
  "payment-workflows/checkout-confirm-negative.bru",
];

const postWebhookRequests = [
  "auth-workflows/login-user.bru",
  "auth-workflows/verify-user-session.bru",
  "payment-workflows/stripe-checkout-completed-webhook.bru",
  "payment-workflows/payment-course-enrolled.bru",
  "payment-workflows/payment-course-in-enrolled-list.bru",
  "payment-workflows/payment-course-sidebar.bru",
  "payment-workflows/payment-course-lesson-content.bru",
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
