import { describe, expect, it } from "@jest/globals";
import {
  applyTranslations,
  type Change,
  type CourseSnapshot,
  planTranslations,
  type TranslationDb,
} from "../../src/scripts/course-translations.js";

function snapshot(): CourseSnapshot {
  return {
    id: "course-1",
    text: {
      titleEn: "AI Fast",
      titleVi: null,
      smallDescriptionEn: null,
      smallDescriptionVi: "Video ngắn",
      descriptionEn: null,
      descriptionVi: null,
    },
    chapters: [{ id: "chapter-1", position: 1, titleEn: null, titleVi: "Chương 1" }],
    lessons: [{ id: "lesson-1", chapterPosition: 1, position: 1, titleEn: null, titleVi: "Bài 1: The CLAUDE.md file" }],
  };
}

function fakeDb(courses: Record<string, CourseSnapshot>) {
  const applied: Change[][] = [];
  const db: TranslationDb = {
    loadCourse: async (slug) => courses[slug] ?? null,
    applyChanges: async (changes) => {
      applied.push(changes);
      return [];
    },
  };
  return { db, applied };
}

describe("planTranslations", () => {
  it("plans empty columns and skips filled ones", async () => {
    const { db } = fakeDb({ "ai-fast": snapshot() });
    const changes = await planTranslations(
      db,
      {
        "ai-fast": {
          course: { titleEn: "AI Fast", titleVi: "AI Fast", smallDescriptionVi: "Khác" },
          chapters: { "1": { titleEn: "Chapter 1", titleVi: "Chương 1" } },
          lessons: { "1.1": { titleEn: "Lesson 1: The CLAUDE.md file", titleVi: "Bài 1: Tệp CLAUDE.md" } },
        },
      },
      { overwrite: false }
    );

    expect(changes).toEqual([
      { table: "Course", id: "course-1", column: "titleVi", from: null, to: "AI Fast" },
      { table: "Chapter", id: "chapter-1", column: "titleEn", from: null, to: "Chapter 1" },
      { table: "Lesson", id: "lesson-1", column: "titleEn", from: null, to: "Lesson 1: The CLAUDE.md file" },
    ]);
  });

  it("replaces a filled column that differs when overwrite is on", async () => {
    const { db } = fakeDb({ "ai-fast": snapshot() });
    const changes = await planTranslations(
      db,
      { "ai-fast": { course: {}, chapters: {}, lessons: { "1.1": { titleVi: "Bài 1: Tệp CLAUDE.md" } } } },
      { overwrite: true }
    );

    expect(changes).toEqual([
      {
        table: "Lesson",
        id: "lesson-1",
        column: "titleVi",
        from: "Bài 1: The CLAUDE.md file",
        to: "Bài 1: Tệp CLAUDE.md",
      },
    ]);
  });

  it("names an unknown slug, chapter or lesson", async () => {
    const { db } = fakeDb({ "ai-fast": snapshot() });
    const empty = { course: {}, chapters: {}, lessons: {} };

    await expect(planTranslations(db, { missing: empty }, { overwrite: false })).rejects.toThrow("missing");
    await expect(
      planTranslations(db, { "ai-fast": { ...empty, chapters: { "9": { titleEn: "X" } } } }, { overwrite: false })
    ).rejects.toThrow("ai-fast chapter 9");
    await expect(
      planTranslations(db, { "ai-fast": { ...empty, lessons: { "1.7": { titleEn: "X" } } } }, { overwrite: false })
    ).rejects.toThrow("ai-fast lesson 1.7");
  });
});

describe("applyTranslations", () => {
  it("hands every change to the database in one call", async () => {
    const { db, applied } = fakeDb({});
    const changes: Change[] = [{ table: "Course", id: "course-1", column: "titleVi", from: null, to: "AI Fast" }];

    await applyTranslations(db, changes);

    expect(applied).toEqual([changes]);
  });
});
