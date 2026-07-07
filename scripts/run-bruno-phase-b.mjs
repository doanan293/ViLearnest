import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const requests = [
  "auth-workflows/login-user.bru",
  "auth-workflows/verify-user-session.bru",
  "user-workflows/get-profile-me.bru",
  "user-workflows/update-profile-valid.bru",
  "user-workflows/update-profile-invalid-phone.bru",
  "course-workflows/get-seeded-public-course.bru",
  "course-workflows/list-enrolled-courses.bru",
  "course-workflows/check-seeded-is-enrolled.bru",
  "course-workflows/get-seeded-sidebar.bru",
  "course-workflows/get-seeded-lesson-content.bru",
  "course-workflows/complete-seeded-lesson.bru",
  "course-workflows/get-seeded-lesson-after-complete.bru",
  "course-workflows/get-missing-lesson-content.bru",
  "admin-workflows/user-forbidden-admin-courses.bru",
  "auth-workflows/login-admin.bru",
  "auth-workflows/verify-admin-session.bru",
  "admin-workflows/dashboard-stats.bru",
  "admin-workflows/dashboard-enrollment-stats.bru",
  "admin-workflows/list-users.bru",
  "admin-workflows/get-bruno-user-profile.bru",
  "storage-workflows/presign-upload-smoke.bru",
  "storage-workflows/upload-smoke-file.bru",
  "storage-workflows/delete-upload-smoke.bru",
  "storage-workflows/presign-course-cover.bru",
  "storage-workflows/upload-course-cover.bru",
  "storage-workflows/presign-lesson-thumbnail.bru",
  "storage-workflows/upload-lesson-thumbnail.bru",
  "storage-workflows/presign-lesson-video.bru",
  "storage-workflows/upload-lesson-video.bru",
  "admin-workflows/create-course.bru",
  "admin-workflows/find-created-course.bru",
  "admin-workflows/update-course.bru",
  "admin-workflows/create-chapter.bru",
  "admin-workflows/reorder-chapters.bru",
  "admin-workflows/create-lesson.bru",
  "admin-workflows/update-lesson.bru",
  "admin-workflows/reorder-lessons.bru",
  "admin-workflows/get-created-course.bru",
  "admin-workflows/get-created-lesson.bru",
  "admin-workflows/public-created-course-visible.bru",
  "admin-workflows/delete-created-lesson.bru",
  "admin-workflows/delete-created-chapter.bru",
  "admin-workflows/delete-created-course.bru",
  "admin-workflows/missing-created-course-after-delete.bru",
  "storage-workflows/delete-course-cover.bru",
  "storage-workflows/delete-lesson-thumbnail.bru",
  "storage-workflows/delete-lesson-video.bru",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === null || result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }

  return result;
}

function runBru(requests) {
  run("npx", ["bru", "run", ...requests, "--env", "local", "--bail"], { cwd: brunoDir });
}

run("npm", ["run", "db:seed-bruno-api", "--workspace=@andv-lms/backend"]);
run("npm", ["run", "bruno:check-storage-env", "--workspace=@andv-lms/backend"]);
runBru(requests);
