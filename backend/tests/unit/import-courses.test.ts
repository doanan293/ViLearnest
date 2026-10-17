import { describe, expect, it } from "@jest/globals";
import { chapterTitleValues, courseTextValues, lessonTitleValues } from "../../src/scripts/import-course-text.js";

describe("course import text", () => {
  it("maps bilingual manifest course fields to the En and Vi columns", () => {
    const values = courseTextValues(
      { title: { en: "AI Fast", vi: "AI Fast" }, smallDescription: { en: "Short videos", vi: "Video ngắn" } },
      { en: '{"type":"doc"}', vi: null }
    );

    expect(values).toEqual({
      titleEn: "AI Fast",
      titleVi: "AI Fast",
      smallDescriptionEn: "Short videos",
      smallDescriptionVi: "Video ngắn",
      descriptionEn: '{"type":"doc"}',
      descriptionVi: null,
    });
  });

  it("maps a bilingual chapter title", () => {
    expect(chapterTitleValues({ en: "Chapter 1: Claude Code basics", vi: "Chương 1: Claude Code cơ bản" })).toEqual({
      titleEn: "Chapter 1: Claude Code basics",
      titleVi: "Chương 1: Claude Code cơ bản",
    });
  });

  it("numbers lesson titles in each language and strips the Codex series prefix", () => {
    expect(
      lessonTitleValues({ en: "OpenAI Codex Tutorial #1 - Introduction & Setup", vi: "Giới thiệu & Cài đặt" }, 1)
    ).toEqual({ titleEn: "Lesson 1: Introduction & Setup", titleVi: "Bài 1: Giới thiệu & Cài đặt" });
  });

  it("treats a plain string manifest value as English only", () => {
    expect(chapterTitleValues("Course content")).toEqual({ titleEn: "Course content", titleVi: null });
    expect(lessonTitleValues("what is a perceptron ?", 3)).toEqual({
      titleEn: "Lesson 3: What is a perceptron ?",
      titleVi: null,
    });
  });
});
