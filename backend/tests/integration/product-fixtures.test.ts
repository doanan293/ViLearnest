import { randomUUID } from "node:crypto";
import { expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import { openIntegrationDatabase } from "../support/integrationDatabase.js";
import { cleanupProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

it("cleans exact fixture IDs without affecting another scope or unrelated user", async () => {
  const database = await openIntegrationDatabase();
  const a = await setupProductFixtures(randomUUID());
  const b = await setupProductFixtures(randomUUID());
  const sentinel = `sentinel-${randomUUID()}`;
  try {
    const { user } = await import("../../src/db/schema.js");
    await database.db.insert(user).values({ id: sentinel, email: `${sentinel}@example.com`, name: "Sentinel" });
    await cleanupProductFixtures(a);
    await cleanupProductFixtures(a);
    expect(await database.db.query.user.findFirst({ where: eq(user.id, a.actors.admin.id) })).toBeUndefined();
    expect(await database.db.query.user.findFirst({ where: eq(user.id, b.actors.admin.id) })).toBeDefined();
    expect(await database.db.query.user.findFirst({ where: eq(user.id, sentinel) })).toBeDefined();
    const { course } = await import("../../src/db/schema.js");
    expect(await database.db.query.course.findFirst({ where: eq(course.id, a.ids.activeCourse) })).toBeUndefined();
    expect(await database.db.query.course.findFirst({ where: eq(course.id, b.ids.activeCourse) })).toBeDefined();
  } finally {
    await cleanupProductFixtures(a);
    await cleanupProductFixtures(b);
    const { user } = await import("../../src/db/schema.js");
    await database.db.delete(user).where(eq(user.id, sentinel));
    await database.close();
  }
});
