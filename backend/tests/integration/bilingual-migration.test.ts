import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import postgres from "postgres";
import { requireTestDatabaseUrl } from "../support/integrationDatabase.js";

const drizzleDir = join(process.cwd(), "drizzle");
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

describe("migration 0006 bilingual content", () => {
  const adminUrl = new URL(requireTestDatabaseUrl());
  const scratchName = `vilearnest_migration_test_${Date.now()}`;
  const scratchUrl = new URL(adminUrl.href);
  scratchUrl.pathname = `/${scratchName}`;
  const admin = postgres(adminUrl.href, { max: 1 });
  let sql: postgres.Sql;

  beforeAll(async () => {
    await admin.unsafe(`create database "${scratchName}"`);
    sql = postgres(scratchUrl.href, { max: 1, onnotice: () => {} });

    for (const fileName of migrationFiles.filter((name) => name < "0006")) {
      await runMigration(sql, fileName);
    }

    await sql`insert into "user" (id, name, email) values ('u1', 'Admin', 'admin@example.test')`;
    await sql`
      insert into "Course" (id, title, description, "fileKey", price, duration, level, "stripePriceId",
        category, "smallDescription", slug, status, "userId")
      values ('c1', 'AI Fast', '{"type":"doc","content":[{"type":"text","text":"Khóa học"}]}', 'cover.jpg', 39, 33,
        'Intermediate', 'price_1', 'Development', 'Khóa học gồm các bài học', 'ai-fast', 'Published', 'u1')`;
    await sql`insert into "Chapter" (id, title, position, "courseId") values ('ch1', 'Chương 1: Claude Code cơ bản', 1, 'c1')`;
    await sql`insert into "Lesson" (id, title, description, position, "chapterId") values ('l1', 'The CLAUDE.md file', null, 1, 'ch1')`;

    const migration0006 = migrationFiles.find((name) => name.startsWith("0006"));
    if (!migration0006) {
      throw new Error("migration 0006 is missing");
    }
    await runMigration(sql, migration0006);
  });

  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists "${scratchName}"`);
    await admin.end();
  });

  it("puts each course field in the column of its language", async () => {
    const [course] = await sql`select * from "Course" where id = 'c1'`;
    expect(course).toMatchObject({
      titleEn: "AI Fast",
      titleVi: null,
      smallDescriptionEn: null,
      smallDescriptionVi: "Khóa học gồm các bài học",
      descriptionEn: null,
      descriptionVi: '{"type":"doc","content":[{"type":"text","text":"Khóa học"}]}',
    });
  });

  it("puts a Vietnamese chapter title in titleVi", async () => {
    const [chapter] = await sql`select * from "Chapter" where id = 'ch1'`;
    expect(chapter).toMatchObject({ titleEn: null, titleVi: "Chương 1: Claude Code cơ bản" });
  });

  it("puts an English lesson title in titleEn and keeps an empty description empty", async () => {
    const [lesson] = await sql`select * from "Lesson" where id = 'l1'`;
    expect(lesson).toMatchObject({
      titleEn: "The CLAUDE.md file",
      titleVi: null,
      descriptionEn: null,
      descriptionVi: null,
    });
  });

  it("drops the single-language columns", async () => {
    const columns = await sql`
      select table_name, column_name from information_schema.columns
      where table_name in ('Course', 'Chapter', 'Lesson')
        and column_name in ('title', 'smallDescription', 'description')`;
    expect(columns).toHaveLength(0);
  });

  it("rejects a chapter without a title in either language", async () => {
    await expect(
      sql`insert into "Chapter" (id, position, "courseId") values ('ch2', 2, 'c1')`
    ).rejects.toMatchObject({ code: "23514" });
  });
});
