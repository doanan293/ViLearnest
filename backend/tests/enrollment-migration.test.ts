import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("timestamp migrations", () => {
  it("repairs updatedAt defaults for existing databases", () => {
    const drizzleDir = join(process.cwd(), "drizzle");
    const migrationSql = readdirSync(drizzleDir)
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort()
      .map((fileName) => readFileSync(join(drizzleDir, fileName), "utf8"))
      .join("\n");

    for (const tableName of [
      "account",
      "Chapter",
      "Course",
      "Enrollment",
      "Lesson",
      "LessonProgess",
      "session",
      "user",
      "user_profile",
      "verification",
    ]) {
      expect(migrationSql).toContain(`ALTER TABLE "${tableName}" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    }
  });

  it("installs updatedAt triggers for mutable timestamped tables", () => {
    const drizzleDir = join(process.cwd(), "drizzle");
    const migrationSql = readdirSync(drizzleDir)
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort()
      .map((fileName) => readFileSync(join(drizzleDir, fileName), "utf8"))
      .join("\n");

    expect(migrationSql).toContain("CREATE OR REPLACE FUNCTION set_updated_at()");
    for (const tableName of [
      "account",
      "Chapter",
      "Course",
      "Enrollment",
      "Lesson",
      "LessonProgess",
      "session",
      "user",
      "user_profile",
      "verification",
    ]) {
      expect(migrationSql).toContain(`CREATE TRIGGER "${tableName}_set_updated_at"`);
    }
  });
});
