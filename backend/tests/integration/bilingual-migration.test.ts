import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import postgres from "postgres";
import { requireTestDatabaseUrl } from "../support/integrationDatabase.js";

// Resolve from this file so the suite runs from the repo root and from backend/.
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
        category, "smallDescription", slug, status, "userId", "updatedAt")
      values ('c1', 'AI Fast', '{"type":"doc","content":[{"type":"text","text":"Khóa học"}]}', 'cover.jpg', 39, 33,
        'Intermediate', 'price_1', 'Development', 'Khóa học gồm các bài học', 'ai-fast', 'Published', 'u1',
        '2026-01-01 00:00:00')`;
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

  it("keeps the single-language columns, now nullable, for the previous deploy", async () => {
    const columns = await sql`
      select table_name, column_name, is_nullable from information_schema.columns
      where table_name in ('Course', 'Chapter', 'Lesson')
        and column_name in ('title', 'smallDescription', 'description')
      order by table_name, column_name`;
    expect(columns.map((column) => `${column.table_name}.${column.column_name}:${column.is_nullable}`)).toEqual([
      "Chapter.title:YES",
      "Course.description:YES",
      "Course.smallDescription:YES",
      "Course.title:YES",
      "Lesson.description:YES",
      "Lesson.title:YES",
    ]);
  });

  it("does not bump updatedAt while copying text", async () => {
    const [course] = await sql`select "updatedAt" = '2026-01-01 00:00:00' as unchanged from "Course" where id = 'c1'`;
    expect(course.unchanged).toBe(true);
  });

  it("lets the new code insert rows without the old columns", async () => {
    await expect(
      sql`insert into "Chapter" (id, "titleVi", position, "courseId") values ('ch2', 'Chương 2', 2, 'c1')`
    ).resolves.toBeDefined();
  });
});
