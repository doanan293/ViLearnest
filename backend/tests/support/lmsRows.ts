import type * as schema from "../../src/db/schema.js";

export type LmsActor = { id: string; email: string; password: string };
export type LmsRowsInput = {
  actors: Record<"admin" | "learnerA" | "learnerB", LmsActor>;
  ids: Record<string, string>;
  passwordHash: string;
  now: Date;
  assetPrefix: string;
  omitLearnerA: boolean;
  includeArchivedEnrollments: boolean;
};
export type FixtureRows = {
  users: Array<typeof schema.user.$inferInsert>;
  accounts: Array<typeof schema.account.$inferInsert>;
  userProfiles: Array<typeof schema.userProfile.$inferInsert>;
  courses: Array<typeof schema.course.$inferInsert>;
  chapters: Array<typeof schema.chapter.$inferInsert>;
  lessons: Array<typeof schema.lesson.$inferInsert>;
  enrollments: Array<typeof schema.enrollment.$inferInsert>;
  lessonProgress: Array<typeof schema.lessonProgress.$inferInsert>;
};
const actorOrder = ["admin", "learnerA", "learnerB"] as const;
export function tipTapDocument(text: string) {
  return JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
}
export function buildLmsRows(input: LmsRowsInput): FixtureRows {
  const { ids, actors, passwordHash, now, assetPrefix, omitLearnerA, includeArchivedEnrollments } = input;
  const users: Array<typeof schema.user.$inferInsert> = actorOrder
    .filter((actor) => !omitLearnerA || actor !== "learnerA")
    .map((actor) => ({
      id: actors[actor].id,
      name: actor === "admin" ? "Bruno Run Admin" : `Bruno ${actor}`,
      email: actors[actor].email,
      emailVerified: true,
      role: actor === "admin" ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
    }));
  const accounts: Array<typeof schema.account.$inferInsert> = users.map((user) => ({
    id: `${user.id}-credential`,
    accountId: user.id,
    providerId: "credential",
    userId: user.id,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  }));
  const userProfiles: Array<typeof schema.userProfile.$inferInsert> = users.map((user) => ({
    userId: user.id,
    phoneVerified: false,
    createdAt: now,
    updatedAt: now,
  }));

  const courseSpecs = [
    ["publishedCourse", "publishedSlug", "Bruno Published Fixture", "Published", 0],
    ["draftCourse", "draftSlug", "Bruno Draft Fixture", "Draft", 0],
    ["archivedCourse", "archivedSlug", "Bruno Archived Fixture", "Archived", 0],
    ["activeCourse", "activeSlug", "Bruno Active Course Fixture", "Published", 0],
    ["pendingCourse", "pendingSlug", "Bruno Pending Course Fixture", "Published", 49],
    ["unenrolledCourse", "unenrolledSlug", "Bruno Unenrolled Course Fixture", "Published", 0],
  ] as const;
  const courses: Array<typeof schema.course.$inferInsert> = courseSpecs.map(
    ([idKey, slugKey, title, status, price]) => ({
      id: ids[idKey],
      title,
      description: tipTapDocument(title),
      fileKey: `${assetPrefix}/${idKey}.png`,
      price,
      duration: 30,
      level: "Beginner",
      stripePriceId: `mock-price-${ids[idKey]}`,
      category: "Testing",
      smallDescription: title,
      slug: ids[slugKey],
      status,
      userId: actors.admin.id,
      createdAt: now,
      updatedAt: now,
    })
  );

  const chapterSpecs = [
    [ids.chapterA, "Chapter A", ids.publishedCourse],
    [ids.chapterB, "Chapter B", ids.publishedCourse],
    [ids.activeChapter, "Active Chapter", ids.activeCourse],
    [ids.pendingChapter, "Pending Chapter", ids.pendingCourse],
    [ids.unenrolledChapter, "Unenrolled Chapter", ids.unenrolledCourse],
  ] as const;
  const chapters: Array<typeof schema.chapter.$inferInsert> = chapterSpecs.map(([id, title, courseId], index) => ({
    id,
    title,
    courseId,
    position: index + 1,
    createdAt: now,
    updatedAt: now,
  }));
  const lessonSpecs = [
    [ids.lessonA, "Lesson A", ids.chapterA],
    [ids.lessonB, "Lesson B", ids.chapterB],
    [ids.activeLesson, "Active Lesson", ids.activeChapter],
    [ids.pendingLesson, "Pending Lesson", ids.pendingChapter],
    [ids.unenrolledLesson, "Unenrolled Lesson", ids.unenrolledChapter],
  ] as const;
  const lessons: Array<typeof schema.lesson.$inferInsert> = lessonSpecs.map(([id, title, chapterId], index) => ({
    id,
    title,
    chapterId,
    description: tipTapDocument(title),
    thumbnailKey: `${assetPrefix}/${id}.png`,
    videoKey: `${assetPrefix}/${id}.mp4`,
    position: index + 1,
    createdAt: now,
    updatedAt: now,
  }));
  const possibleEnrollments: Array<typeof schema.enrollment.$inferInsert> = [
    {
      id: `${ids.activeCourse}-enrollment-a`,
      userId: actors.learnerA.id,
      courseId: ids.activeCourse,
      amount: 0,
      status: "Active",
    },
    {
      id: `${ids.activeCourse}-enrollment-b`,
      userId: actors.learnerB.id,
      courseId: ids.activeCourse,
      amount: 0,
      status: "Active",
    },
    {
      id: `${ids.pendingCourse}-enrollment-a`,
      userId: actors.learnerA.id,
      courseId: ids.pendingCourse,
      amount: 49,
      status: "Pending",
    },
    ...(includeArchivedEnrollments
      ? [
          {
            id: `${ids.archivedCourse}-enrollment-a`,
            userId: actors.learnerA.id,
            courseId: ids.archivedCourse,
            amount: 0,
            status: "Active" as const,
          },
          {
            id: `${ids.archivedCourse}-enrollment-b`,
            userId: actors.learnerB.id,
            courseId: ids.archivedCourse,
            amount: 0,
            status: "Active" as const,
          },
        ]
      : []),
  ];
  const enrollments = possibleEnrollments.filter((enrollment) => users.some((user) => user.id === enrollment.userId));
  const lessonProgress: Array<typeof schema.lessonProgress.$inferInsert> = users.some(
    (user) => user.id === actors.learnerA.id
  )
    ? [
        {
          id: `${ids.activeLesson}-progress-a`,
          userId: actors.learnerA.id,
          lessonId: ids.activeLesson,
          completed: false,
        },
      ]
    : [];

  return { users, accounts, userProfiles, courses, chapters, lessons, enrollments, lessonProgress };
}
