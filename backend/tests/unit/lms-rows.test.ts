import { describe, expect, it } from "@jest/globals";
import { buildLmsRows, type LmsRowsInput } from "../support/lmsRows.js";

function input(scope: string, omitLearnerA = false): LmsRowsInput {
  const names = [
    "admin",
    "learnerA",
    "learnerB",
    "publishedCourse",
    "publishedSlug",
    "draftCourse",
    "draftSlug",
    "archivedCourse",
    "archivedSlug",
    "activeCourse",
    "activeSlug",
    "pendingCourse",
    "pendingSlug",
    "unenrolledCourse",
    "unenrolledSlug",
    "chapterA",
    "chapterB",
    "activeChapter",
    "pendingChapter",
    "unenrolledChapter",
    "lessonA",
    "lessonB",
    "activeLesson",
    "pendingLesson",
    "unenrolledLesson",
  ];
  const ids = Object.fromEntries(names.map((name) => [name, `${scope}-${name}`]));
  const actor = (name: string) => ({ id: ids[name], email: `${scope}-${name}@example.com`, password: "Test123!" });
  return {
    actors: { admin: actor("admin"), learnerA: actor("learnerA"), learnerB: actor("learnerB") },
    ids,
    passwordHash: "hashed",
    now: new Date("2026-01-01"),
    assetPrefix: `assets/${scope}`,
    omitLearnerA,
    includeArchivedEnrollments: true,
  };
}

describe("LMS fixture rows", () => {
  it("isolates identifiers and associates rows only with actors in that scope", () => {
    const a = buildLmsRows(input("a"));
    const b = buildLmsRows(input("b"));
    expect(a.users.map((row) => row.id)).toEqual(["a-admin", "a-learnerA", "a-learnerB"]);
    expect(a.courses.some((row) => b.courses.some((other) => other.id === row.id))).toBe(false);
    expect(a.courses.map((row) => row.status)).toEqual([
      "Published",
      "Draft",
      "Archived",
      "Published",
      "Published",
      "Published",
    ]);
    expect(a.courses.find((row) => row.id === "a-pendingCourse")?.price).toBe(49);
    expect(a.enrollments.find((row) => row.id === "a-pendingCourse-enrollment-a")).toMatchObject({
      userId: "a-learnerA",
      status: "Pending",
      amount: 49,
    });
    expect(a.lessonProgress).toEqual([
      expect.objectContaining({ userId: "a-learnerA", lessonId: "a-activeLesson", completed: false }),
    ]);
    expect(a.chapters.every((row) => a.courses.some((course) => course.id === row.courseId))).toBe(true);
    expect(a.lessons.every((row) => a.chapters.some((chapter) => chapter.id === row.chapterId))).toBe(true);
  });
  it("omits an unregistered actor and all of its dependent rows", () => {
    const rows = buildLmsRows(input("auth", true));
    expect(rows.users).toHaveLength(2);
    expect(rows.accounts.some((row) => row.userId === "auth-learnerA")).toBe(false);
    expect(rows.userProfiles.some((row) => row.userId === "auth-learnerA")).toBe(false);
    expect(rows.enrollments.every((row) => row.userId === "auth-learnerB")).toBe(true);
    expect(rows.lessonProgress).toEqual([]);
  });
});
