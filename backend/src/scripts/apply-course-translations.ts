import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { client, db } from "../db/index.js";
import * as schema from "../db/schema.js";
import {
  applyTranslations,
  type Change,
  planTranslations,
  type TranslationData,
  type TranslationDb,
} from "./course-translations.js";

// Usage: tsx --env-file=.env src/scripts/apply-course-translations.ts [--dry-run] [--overwrite]
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_PATH = path.resolve(CURRENT_DIR, "../../scripts/course-translations.json");

const TABLES = { Course: schema.course, Chapter: schema.chapter, Lesson: schema.lesson } as const;

const drizzleStore: TranslationDb = {
  async loadCourse(slug) {
    const course = await db.query.course.findFirst({ where: eq(schema.course.slug, slug) });
    if (!course) return null;

    const chapters = await db
      .select({
        id: schema.chapter.id,
        position: schema.chapter.position,
        titleEn: schema.chapter.titleEn,
        titleVi: schema.chapter.titleVi,
      })
      .from(schema.chapter)
      .where(eq(schema.chapter.courseId, course.id))
      .orderBy(asc(schema.chapter.position));

    const chapterIds = chapters.map((chapter) => chapter.id);
    const lessons =
      chapterIds.length === 0
        ? []
        : await db
            .select({
              id: schema.lesson.id,
              chapterId: schema.lesson.chapterId,
              position: schema.lesson.position,
              titleEn: schema.lesson.titleEn,
              titleVi: schema.lesson.titleVi,
            })
            .from(schema.lesson)
            .where(inArray(schema.lesson.chapterId, chapterIds));

    return {
      id: course.id,
      text: {
        titleEn: course.titleEn,
        titleVi: course.titleVi,
        smallDescriptionEn: course.smallDescriptionEn,
        smallDescriptionVi: course.smallDescriptionVi,
        descriptionEn: course.descriptionEn,
        descriptionVi: course.descriptionVi,
      },
      chapters,
      lessons: lessons.map(({ chapterId, ...lesson }) => ({
        ...lesson,
        chapterPosition: chapters.find((chapter) => chapter.id === chapterId)?.position ?? -1,
      })),
    };
  },

  // Each UPDATE only applies while the cell still holds the planned "from" value,
  // so an admin edit made after the plan is kept and reported as skipped.
  async applyChanges(changes) {
    return db.transaction(async (tx) => {
      const skipped: Change[] = [];
      for (const change of changes) {
        const table = TABLES[change.table];
        const column = (table as unknown as Record<string, Parameters<typeof eq>[0]>)[change.column];
        const updated = await tx
          .update(table)
          .set({ [change.column]: change.to })
          .where(and(eq(table.id, change.id), change.from === null ? isNull(column) : eq(column, change.from)))
          .returning({ id: table.id });
        if (updated.length === 0) skipped.push(change);
      }
      return skipped;
    });
  },
};

function describe(change: Change) {
  const from = change.from === null ? "(empty)" : JSON.stringify(change.from.slice(0, 60));
  return `${change.table} ${change.id} ${change.column}: ${from} -> ${JSON.stringify(change.to.slice(0, 60))}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const overwrite = process.argv.includes("--overwrite");
  const data = JSON.parse(await readFile(TRANSLATIONS_PATH, "utf8")) as TranslationData;

  const changes = await planTranslations(drizzleStore, data, { overwrite });
  for (const change of changes) console.log(describe(change));
  console.log(`${changes.length} change(s)${dryRun ? " planned (dry run, nothing written)" : ""}.`);

  if (!dryRun) {
    const skipped = await applyTranslations(drizzleStore, changes);
    for (const change of skipped) console.log(`Skipped (changed since planning): ${describe(change)}`);
    console.log(`Applied ${changes.length - skipped.length} change(s).`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
