import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import postgres from "postgres";
import { requireTestDatabaseUrl } from "../support/integrationDatabase.js";

const drizzleDir = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrationFiles = readdirSync(drizzleDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

async function runMigration(sql: postgres.Sql, fileName: string) {
  const statements = readFileSync(join(drizzleDir, fileName), "utf8").split("--> statement-breakpoint");
  for (const statement of statements) {
    if (statement.trim()) {
      await sql.unsafe(statement);
    }
  }
}

describe("migration 0007 drops the single-language columns", () => {
  const adminUrl = new URL(requireTestDatabaseUrl());
  const scratchName = `vilearnest_migration_0007_test_${Date.now()}`;
  const scratchUrl = new URL(adminUrl.href);
  scratchUrl.pathname = `/${scratchName}`;
  const admin = postgres(adminUrl.href, { max: 1 });
  let sql: postgres.Sql;

  beforeAll(async () => {
    await admin.unsafe(`create database "${scratchName}"`);
    sql = postgres(scratchUrl.href, { max: 1, onnotice: () => {} });
    for (const fileName of migrationFiles.filter((name) => name < "0007")) {
      await runMigration(sql, fileName);
    }

    // The previous deploy keeps writing only the old columns until the new code is live.
    await sql`insert into "user" (id, name, email) values ('u1', 'Admin', 'admin@example.test')`;
    await sql`
      insert into "Course" (id, title, description, "fileKey", price, duration, level, "stripePriceId",
        category, "smallDescription", slug, status, "userId")
      values ('c1', 'Written by the old deploy', '{"type":"doc"}', 'cover.jpg', 10, 1, 'Beginner', 'price_1',
        'Development', 'Short', 'old-deploy', 'Draft', 'u1')`;
    await sql`insert into "Chapter" (id, title, position, "courseId") values ('ch1', 'Old chapter', 1, 'c1')`;

    const migration0007 = migrationFiles.find((name) => name.startsWith("0007"));
    if (!migration0007) {
      throw new Error("migration 0007 is missing");
    }
    await runMigration(sql, migration0007);
  });

  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists "${scratchName}"`);
    await admin.end();
  });

  it("copies text the old deploy wrote after 0006 into the English columns", async () => {
    const [course] = await sql`select * from "Course" where id = 'c1'`;
    expect(course).toMatchObject({
      titleEn: "Written by the old deploy",
      smallDescriptionEn: "Short",
      descriptionEn: '{"type":"doc"}',
    });
    const [chapter] = await sql`select * from "Chapter" where id = 'ch1'`;
    expect(chapter).toMatchObject({ titleEn: "Old chapter", titleVi: null });
  });

  it("drops the single-language columns", async () => {
    const columns = await sql`
      select table_name, column_name from information_schema.columns
      where table_name in ('Course', 'Chapter', 'Lesson')
        and column_name in ('title', 'smallDescription', 'description')`;
    expect(columns).toHaveLength(0);
  });

  it("rejects a chapter whose titles are empty or only spaces", async () => {
    await expect(
      sql`insert into "Chapter" (id, "titleEn", position, "courseId") values ('ch2', '  ', 2, 'c1')`
    ).rejects.toMatchObject({ code: "23514" });
  });
});
