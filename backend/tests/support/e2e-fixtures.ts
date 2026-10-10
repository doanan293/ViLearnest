import { inArray } from "drizzle-orm";
import * as schema from "../../src/db/schema.js";
import { openIntegrationDatabase, requireTestDatabaseUrl } from "./integrationDatabase.js";
import { cleanupProductFixtures, describeProductFixtures, setupProductFixtures } from "./productFixtures.js";

async function main() {
  const [action, flag, scope] = process.argv.slice(2);
  if (!scope || flag !== "--scope" || !["setup", "cleanup", "validate"].includes(action))
    throw new Error("Usage: e2e-fixtures.ts setup|cleanup --scope <uuid>");
  const fixtures = describeProductFixtures(scope);
  requireTestDatabaseUrl();
  if (action === "validate") return;
  if (action === "cleanup") {
    await cleanupProductFixtures(fixtures);
    process.stdout.write(JSON.stringify({ cleaned: scope }));
    return;
  }
  await setupProductFixtures(scope);
  try {
    const connection = await openIntegrationDatabase();
    try {
      await connection.db
        .update(schema.lesson)
        .set({ videoKey: null, thumbnailKey: null })
        .where(
          inArray(schema.lesson.id, [
            fixtures.ids.activeLesson,
            fixtures.ids.pendingLesson,
            fixtures.ids.unenrolledLesson,
          ])
        );
    } finally {
      await connection.close();
    }
  } catch (error) {
    await cleanupProductFixtures(fixtures);
    throw error;
  }
  process.stdout.write(JSON.stringify(fixtures));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Fixture operation failed");
  process.exitCode = 1;
});
