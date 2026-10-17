import { describe, expect, it } from "@jest/globals";
import { localizeChapter, localizeCourse, localizeLesson, parseLocale, pickText } from "../../src/lib/localize.js";

const course = {
  id: "course-1",
  slug: "ai-fast",
  price: 39,
  titleEn: "AI Fast",
  titleVi: "AI Nhanh",
  smallDescriptionEn: "Short",
  smallDescriptionVi: "Ngắn",
  descriptionEn: '{"type":"doc"}',
  descriptionVi: null,
};

describe("parseLocale", () => {
  it("accepts vi", () => {
    expect(parseLocale("vi")).toBe("vi");
  });

  it("treats an unknown locale as en", () => {
    expect(parseLocale("fr")).toBe("en");
  });

  it("treats a missing locale as en", () => {
    expect(parseLocale(undefined)).toBe("en");
  });
});

describe("pickText", () => {
  it("returns the requested language", () => {
    expect(pickText({ titleEn: "A", titleVi: "B" }, "title", "vi")).toBe("B");
  });

  it("falls back to English when Vietnamese is empty", () => {
    expect(pickText({ titleEn: "A", titleVi: "" }, "title", "vi")).toBe("A");
  });

  it("falls back to Vietnamese when English is missing", () => {
    expect(pickText({ titleEn: null, titleVi: "B" }, "title", "en")).toBe("B");
  });

  it("returns null when both languages are empty", () => {
    expect(pickText({ descriptionEn: null, descriptionVi: null }, "description", "en")).toBeNull();
  });
});

describe("localizeCourse", () => {
  it("maps per-language columns to the public shape and keeps other fields", () => {
    const result = localizeCourse(course, "vi");

    expect(result).toEqual({
      id: "course-1",
      slug: "ai-fast",
      price: 39,
      title: "AI Nhanh",
      smallDescription: "Ngắn",
      description: '{"type":"doc"}',
    });
    expect(result).not.toHaveProperty("titleEn");
    expect(result).not.toHaveProperty("titleVi");
  });
});

describe("localizeChapter", () => {
  it("maps the chapter title", () => {
    expect(localizeChapter({ id: "c1", position: 1, titleEn: null, titleVi: "Chương 1" }, "en")).toEqual({
      id: "c1",
      position: 1,
      title: "Chương 1",
    });
  });
});

describe("localizeLesson", () => {
  it("maps the lesson title and description", () => {
    expect(
      localizeLesson(
        { id: "l1", titleEn: "Hooks", titleVi: "Hooks (VI)", descriptionEn: null, descriptionVi: null },
        "vi"
      )
    ).toEqual({ id: "l1", title: "Hooks (VI)", description: null });
  });
});
