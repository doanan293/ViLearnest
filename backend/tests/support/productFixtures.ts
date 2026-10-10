import { hashPassword } from "better-auth/crypto";
import { inArray } from "drizzle-orm";
import * as schema from "../../src/db/schema.js";
import { openIntegrationDatabase } from "./integrationDatabase.js";
import { buildLmsRows, type LmsRowsInput } from "./lmsRows.js";

export type ProductFixtures = { scope: string; actors: LmsRowsInput["actors"]; ids: Record<string, string> };
const names = [
  "admin",
  "learnerA",
  "learnerB",
  "publishedCourse",
  "publishedSlug",
  "draftCourse",
  "draftSlug",
  "archivedCourse",
  "archivedSlug",
  "activeCourse",
  "activeSlug",
  "pendingCourse",
  "pendingSlug",
  "unenrolledCourse",
  "unenrolledSlug",
  "chapterA",
  "chapterB",
  "activeChapter",
  "pendingChapter",
  "unenrolledChapter",
  "lessonA",
  "lessonB",
  "activeLesson",
  "pendingLesson",
  "unenrolledLesson",
];

export function describeProductFixtures(scope: string): ProductFixtures {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scope))
    throw new Error("Fixture scope must be a UUID");
  const ids = Object.fromEntries(names.map((name) => [name, `test-${scope}-${name}`]));
  const actor = (name: string) => ({
    id: ids[name],
    email: `test-${scope}-${name.toLowerCase()}@example.com`,
    password: "LmsTest123!",
  });
  return { scope, ids, actors: { admin: actor("admin"), learnerA: actor("learnerA"), learnerB: actor("learnerB") } };
}

export async function setupProductFixtures(scope: string): Promise<ProductFixtures> {
  const fixtures = describeProductFixtures(scope);
  const connection = await openIntegrationDatabase();
  try {
    const rows = buildLmsRows({
      ...fixtures,
      passwordHash: await hashPassword(fixtures.actors.admin.password),
      now: new Date(),
      assetPrefix: `test-assets/${scope}`,
      omitLearnerA: false,
      includeArchivedEnrollments: true,
    });
    await connection.db.transaction(async (tx) => {
      await tx.insert(schema.user).values(rows.users);
      await tx.insert(schema.account).values(rows.accounts);
      await tx.insert(schema.userProfile).values(rows.userProfiles);
      await tx.insert(schema.course).values(rows.courses);
      await tx.insert(schema.chapter).values(rows.chapters);
      await tx.insert(schema.lesson).values(rows.lessons);
      await tx.insert(schema.enrollment).values(rows.enrollments);
      await tx.insert(schema.lessonProgress).values(rows.lessonProgress);
    });
    return fixtures;
  } finally {
    await connection.close();
  }
}

export async function cleanupProductFixtures(fixtures: ProductFixtures): Promise<void> {
  const owned = describeProductFixtures(fixtures.scope);
  const connection = await openIntegrationDatabase();
  try {
    await connection.db.transaction(async (tx) => {
      await tx.delete(schema.course).where(
        inArray(
          schema.course.id,
          Object.entries(owned.ids)
            .filter(([name]) => name.endsWith("Course"))
            .map(([, id]) => id)
        )
      );
      await tx.delete(schema.user).where(
        inArray(
          schema.user.id,
          Object.values(owned.actors).map((actor) => actor.id)
        )
      );
    });
  } finally {
    await connection.close();
  }
}
