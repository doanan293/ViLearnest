import { describe, expect, it } from "@jest/globals";
import { sql } from "drizzle-orm";
import { openIntegrationDatabase } from "../support/integrationDatabase.js";

describe("isolated integration database harness", () => {
  it("connects only to TEST_DATABASE_URL and closes its own client", async () => {
    const integration = await openIntegrationDatabase();
    try {
      const result = await integration.db.execute(sql`select current_database() as name`);
      expect(result[0]?.name).toBe(new URL(process.env.TEST_DATABASE_URL!).pathname.slice(1));
    } finally {
      await integration.close();
    }
  });

  it("keeps an unrelated sentinel row when test-owned data is removed", async () => {
    const integration = await openIntegrationDatabase();
    try {
      await integration.db.transaction(async (tx) => {
        await tx.execute(sql`create temporary table bruno_harness_sentinel (id text primary key)`);
        await tx.execute(sql`insert into bruno_harness_sentinel values ('unrelated')`);
        await tx.execute(sql`delete from bruno_harness_sentinel where id = 'owned-by-test'`);
        const result = await tx.execute(sql`select id from bruno_harness_sentinel`);
        expect(result).toEqual([{ id: "unrelated" }]);
      });
    } finally {
      await integration.close();
    }
  });
});
