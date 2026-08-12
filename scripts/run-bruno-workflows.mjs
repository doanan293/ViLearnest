import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brunoDir = path.join(rootDir, "bruno");

const requests = [
  "07-user-workflows/03-login-user.bru",
  "07-user-workflows/04-verify-user-session.bru",
  "07-user-workflows/05-get-profile-me.bru",
  "07-user-workflows/06-update-profile-valid.bru",
  "07-user-workflows/07-update-profile-invalid-phone.bru",
  "08-course-workflows/01-get-seeded-public-course.bru",
  "08-course-workflows/02-list-enrolled-courses.bru",
  "08-course-workflows/03-check-seeded-is-enrolled.bru",
  "08-course-workflows/04-get-seeded-sidebar.bru",
  "08-course-workflows/05-get-seeded-lesson-content.bru",
  "08-course-workflows/06-complete-seeded-lesson.bru",
  "08-course-workflows/07-get-seeded-lesson-after-complete.bru",
  "08-course-workflows/08-get-missing-lesson-content.bru",
  "10-admin-workflows/01-user-forbidden-admin-courses.bru",
  "10-admin-workflows/02-login-admin.bru",
  "10-admin-workflows/03-verify-admin-session.bru",
  "10-admin-workflows/04-dashboard-stats.bru",
  "10-admin-workflows/05-dashboard-enrollment-stats.bru",
  "10-admin-workflows/06-list-users.bru",
  "10-admin-workflows/07-get-bruno-user-profile.bru",
  "09-storage-workflows/01-presign-upload-smoke.bru",
  "09-storage-workflows/02-upload-smoke-file.bru",
  "09-storage-workflows/03-delete-upload-smoke.bru",
  "09-storage-workflows/04-presign-course-cover.bru",
  "09-storage-workflows/05-upload-course-cover.bru",
  "09-storage-workflows/06-presign-lesson-thumbnail.bru",
  "09-storage-workflows/07-upload-lesson-thumbnail.bru",
  "09-storage-workflows/08-presign-lesson-video.bru",
  "09-storage-workflows/09-upload-lesson-video.bru",
  "10-admin-workflows/08-create-course.bru",
  "10-admin-workflows/09-find-created-course.bru",
  "10-admin-workflows/10-update-course.bru",
  "10-admin-workflows/11-create-chapter.bru",
  "10-admin-workflows/12-reorder-chapters.bru",
  "10-admin-workflows/13-create-lesson.bru",
  "10-admin-workflows/14-update-lesson.bru",
  "10-admin-workflows/15-reorder-lessons.bru",
  "10-admin-workflows/16-get-created-course.bru",
  "10-admin-workflows/17-get-created-lesson.bru",
  "10-admin-workflows/18-public-created-course-visible.bru",
  "10-admin-workflows/19-delete-created-lesson.bru",
  "10-admin-workflows/20-delete-created-chapter.bru",
  "10-admin-workflows/21-delete-created-course.bru",
  "10-admin-workflows/22-missing-created-course-after-delete.bru",
  "09-storage-workflows/10-delete-course-cover.bru",
  "09-storage-workflows/11-delete-lesson-thumbnail.bru",
  "09-storage-workflows/12-delete-lesson-video.bru",
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
