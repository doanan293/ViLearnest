import { pathToFileURL } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { inArray, like } from "drizzle-orm";
import { client, db } from "../db/index.js";
import * as schema from "../db/schema.js";
import {
  BRUNO_ADMIN_EMAIL,
  BRUNO_AUTH_LIFECYCLE_EMAIL,
  BRUNO_OWNED_EMAILS,
  BRUNO_SEED_IDS,
  BRUNO_USER_EMAIL,
  buildBrunoSeedRows,
  getBrunoPassword,
} from "./brunoSeedData.js";

export async function resetAndSeedBrunoApi(password = getBrunoPassword()) {
  const passwordHash = await hashPassword(password);
  const rows = buildBrunoSeedRows(passwordHash);

  await db.transaction(async (tx) => {
    await tx.delete(schema.course).where(like(schema.course.slug, "bruno-%"));
    await tx.delete(schema.verification).where(like(schema.verification.identifier, `%${BRUNO_AUTH_LIFECYCLE_EMAIL}`));
    await tx.delete(schema.user).where(inArray(schema.user.email, [...BRUNO_OWNED_EMAILS]));

    await tx.insert(schema.user).values(rows.users);
    await tx.insert(schema.account).values(rows.accounts);
    await tx.insert(schema.userProfile).values(rows.userProfiles);
    await tx.insert(schema.course).values(rows.course);
    await tx.insert(schema.chapter).values(rows.chapter);
    await tx.insert(schema.lesson).values(rows.lesson);
    await tx.insert(schema.course).values(rows.paymentCourse);
    await tx.insert(schema.chapter).values(rows.paymentChapter);
    await tx.insert(schema.lesson).values(rows.paymentLesson);
    await tx.insert(schema.course).values(rows.unenrolledCourse);
    await tx.insert(schema.chapter).values(rows.unenrolledChapter);
    await tx.insert(schema.lesson).values(rows.unenrolledLesson);
    await tx.insert(schema.enrollment).values(rows.enrollment);
    await tx.insert(schema.lessonProgress).values(rows.lessonProgress);
  });

  return {
    userEmail: BRUNO_USER_EMAIL,
    adminEmail: BRUNO_ADMIN_EMAIL,
    lifecycleEmail: BRUNO_AUTH_LIFECYCLE_EMAIL,
    seededUserId: BRUNO_SEED_IDS.user,
    seededAdminId: BRUNO_SEED_IDS.admin,
    seededCourseId: BRUNO_SEED_IDS.course,
    seededCourseSlug: rows.course.slug,
    seededLessonId: BRUNO_SEED_IDS.lesson,
    paymentCourseId: BRUNO_SEED_IDS.paymentCourse,
    paymentCourseSlug: rows.paymentCourse.slug,
    paymentLessonId: BRUNO_SEED_IDS.paymentLesson,
    unenrolledCourseId: BRUNO_SEED_IDS.unenrolledCourse,
    unenrolledCourseSlug: rows.unenrolledCourse.slug,
    unenrolledLessonId: BRUNO_SEED_IDS.unenrolledLesson,
  };
}

async function main() {
  const result = await resetAndSeedBrunoApi();
  console.log("Bruno API seed complete:");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error("Bruno API seed failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await client.end();
    });
}
