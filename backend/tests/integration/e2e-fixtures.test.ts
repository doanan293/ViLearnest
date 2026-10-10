import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema.js";
import { openIntegrationDatabase } from "../support/integrationDatabase.js";
import { cleanupProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

const script = fileURLToPath(new URL("../support/e2e-fixtures.ts", import.meta.url));
function run(action: string, scope: string, env = process.env) {
  return spawnSync(process.execPath, ["--import", "tsx", script, action, "--scope", scope], { env, encoding: "utf8" });
}
it("creates browser fixtures and cleans only that UUID twice", async () => {
  const scope = randomUUID();
  const other = await setupProductFixtures(randomUUID());
  const connection = await openIntegrationDatabase();
  try {
    const result = run("setup", scope);
    expect(result.status).toBe(0);
    const fixtures = JSON.parse(result.stdout);
    expect(fixtures.scope).toBe(scope);
    expect(
      await connection.db.query.lesson.findFirst({ where: eq(schema.lesson.id, fixtures.ids.activeLesson) })
    ).toMatchObject({ videoKey: null, thumbnailKey: null });
    expect(run("cleanup", scope).status).toBe(0);
    expect(run("cleanup", scope).status).toBe(0);
    expect(
      await connection.db.query.user.findFirst({ where: eq(schema.user.id, other.actors.admin.id) })
    ).toBeDefined();
  } finally {
    run("cleanup", scope);
    await cleanupProductFixtures(other);
    await connection.close();
  }
});
it("rejects invalid scope and missing isolated database before side effects", () => {
  expect(run("setup", "not-a-uuid").status).not.toBe(0);
  const env = { ...process.env };
  delete env.TEST_DATABASE_URL;
  expect(run("setup", randomUUID(), env).status).not.toBe(0);
});
