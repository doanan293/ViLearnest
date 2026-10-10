import crypto from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../lib/errors.js";
import type { db as dbInstance } from "../index.js";
import * as schema from "../schema.js";

type Database = typeof dbInstance;

export type PublicCourse = Pick<
  typeof schema.course.$inferSelect,
  "id" | "title" | "description" | "fileKey" | "price" | "duration" | "level" | "category" | "smallDescription" | "slug"
> & {
  chapter: Array<
    Pick<typeof schema.chapter.$inferSelect, "id" | "title" | "position"> & {
      lessons: Array<Pick<typeof schema.lesson.$inferSelect, "id" | "title" | "position">>;
    }
  >;
};

export type LessonAccess = { id: string; courseId: string };
export type ReorderItem = { id: string; position: number };
export type ActivationInput = { enrollmentId: string; userId: string; courseId: string; amountMinor: number };

export class CourseRepository {
  constructor(private readonly db: Database) {}

  listPublishedCourses() {
    return this.db.query.course.findMany({
      where: eq(schema.course.status, "Published"),
    });
  }

  listAllCourses() {
    return this.db.query.course.findMany({
      orderBy: [desc(schema.course.createdAt)],
    });
  }

  listRecentCourses(limit = 2) {
    return this.db.query.course.findMany({
      orderBy: [desc(schema.course.updatedAt)],
      limit,
    });
  }

  findCourseById(id: string) {
    return this.db.query.course.findFirst({
      where: eq(schema.course.id, id),
    });
  }

  findPublicCourseBySlug(slug: string): Promise<PublicCourse | undefined> {
    return this.db.query.course.findFirst({
      where: and(eq(schema.course.slug, slug), eq(schema.course.status, "Published")),
      columns: {
        id: true,
        title: true,
        description: true,
        fileKey: true,
        price: true,
        duration: true,
        level: true,
        category: true,
        smallDescription: true,
        slug: true,
      },
      with: {
        chapter: {
          columns: { id: true, title: true, position: true },
          orderBy: [asc(schema.chapter.position)],
          with: {
            lessons: {
              columns: { id: true, title: true, position: true },
              orderBy: [asc(schema.lesson.position)],
            },
          },
        },
      },
    });
  }

  findAdminCourseById(id: string) {
    return this.db.query.course.findFirst({
      where: eq(schema.course.id, id),
      with: {
        chapter: {
          orderBy: [asc(schema.chapter.position)],
          with: {
            lessons: {
              orderBy: [asc(schema.lesson.position)],
            },
          },
        },
      },
    });
  }

  findCourseSidebarBySlug(slug: string, userId: string) {
    return this.db.query.course.findFirst({
      where: eq(schema.course.slug, slug),
      with: {
        chapter: {
          orderBy: [asc(schema.chapter.position)],
          with: {
            lessons: {
              orderBy: [asc(schema.lesson.position)],
              with: {
                lessonProgess: {
                  where: eq(schema.lessonProgress.userId, userId),
                },
              },
            },
          },
        },
      },
    });
  }

  findLessonContent(lessonId: string, userId: string) {
    return this.db.query.lesson.findFirst({
      where: eq(schema.lesson.id, lessonId),
      with: {
        lessonProgess: {
          where: eq(schema.lessonProgress.userId, userId),
        },
        Chapter: {
          with: {
            Course: true,
          },
        },
      },
    });
  }

  findLessonById(id: string) {
    return this.db.query.lesson.findFirst({
      where: eq(schema.lesson.id, id),
    });
  }

  findLessonAccess(lessonId: string): Promise<LessonAccess | undefined> {
    return this.db.query.lesson
      .findFirst({
        where: eq(schema.lesson.id, lessonId),
        columns: { id: true },
        with: { Chapter: { columns: { courseId: true } } },
      })
      .then((lesson) => (lesson ? { id: lesson.id, courseId: lesson.Chapter.courseId } : undefined));
  }

  findEnrollment(userId: string, courseId: string) {
    return this.db.query.enrollment.findFirst({
      where: and(eq(schema.enrollment.userId, userId), eq(schema.enrollment.courseId, courseId)),
    });
  }

  findActiveEnrollments(userId: string) {
    return this.db.query.enrollment.findMany({
      where: and(eq(schema.enrollment.userId, userId), eq(schema.enrollment.status, "Active")),
      with: {
        Course: {
          with: {
            chapter: {
              with: {
                lessons: {
                  with: {
                    lessonProgess: {
                      where: eq(schema.lessonProgress.userId, userId),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.db.query.user.findFirst({
      where: eq(schema.user.id, id),
    });
  }

  findUserByStripeCustomerId(stripeCustomerId: string) {
    return this.db.query.user.findFirst({
      where: eq(schema.user.stripeCustomerId, stripeCustomerId),
    });
  }

  updateUserStripeCustomerId(userId: string, stripeCustomerId: string) {
    return this.db.update(schema.user).set({ stripeCustomerId }).where(eq(schema.user.id, userId));
  }

  createCourse(data: typeof schema.course.$inferInsert) {
    return this.db.insert(schema.course).values(data);
  }

  updateCourse(id: string, data: Partial<typeof schema.course.$inferInsert>) {
    return this.db.update(schema.course).set(data).where(eq(schema.course.id, id));
  }

  deleteCourse(id: string) {
    return this.db.delete(schema.course).where(eq(schema.course.id, id));
  }

  async getNextChapterPosition(courseId: string) {
    const result = await this.db
      .select({ value: sql<number>`coalesce(max(${schema.chapter.position}), 0) + 1` })
      .from(schema.chapter)
      .where(eq(schema.chapter.courseId, courseId));
    return result[0]?.value ?? 1;
  }

  createChapter(data: typeof schema.chapter.$inferInsert) {
    return this.db.insert(schema.chapter).values(data);
  }

  deleteChapter(id: string) {
    return this.db.delete(schema.chapter).where(eq(schema.chapter.id, id));
  }

  async reorderChapters(items: ReorderItem[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      this.validateReorderItems(items);
      const selected = await tx
        .select({ id: schema.chapter.id, courseId: schema.chapter.courseId })
        .from(schema.chapter)
        .where(
          inArray(
            schema.chapter.id,
            items.map(({ id }) => id)
          )
        );
      if (selected.length !== items.length) throw new NotFoundError("Chapter not found");
      const courseIds = [...new Set(selected.map(({ courseId }) => courseId))];
      if (courseIds.length !== 1) throw new BadRequestError("Chapters must belong to the same course");
      const [courseRow] = await tx
        .select({ id: schema.course.id })
        .from(schema.course)
        .where(eq(schema.course.id, courseIds[0]!))
        .for("update");
      if (!courseRow) throw new NotFoundError("Course not found");
      const siblings = await tx
        .select({ id: schema.chapter.id, position: schema.chapter.position })
        .from(schema.chapter)
        .where(eq(schema.chapter.courseId, courseRow.id))
        .for("update");
      this.validateFinalPositions(items, siblings);
      for (const item of items) {
        await tx.update(schema.chapter).set({ position: item.position }).where(eq(schema.chapter.id, item.id));
      }
    });
  }

  async getNextLessonPosition(chapterId: string) {
    const result = await this.db
      .select({ value: sql<number>`coalesce(max(${schema.lesson.position}), 0) + 1` })
      .from(schema.lesson)
      .where(eq(schema.lesson.chapterId, chapterId));
    return result[0]?.value ?? 1;
  }

  createLesson(data: typeof schema.lesson.$inferInsert) {
    return this.db.insert(schema.lesson).values(data);
  }

  updateLesson(id: string, data: Partial<typeof schema.lesson.$inferInsert>) {
    return this.db.update(schema.lesson).set(data).where(eq(schema.lesson.id, id));
  }

  deleteLesson(id: string) {
    return this.db.delete(schema.lesson).where(eq(schema.lesson.id, id));
  }

  async reorderLessons(items: ReorderItem[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      this.validateReorderItems(items);
      const selected = await tx
        .select({ id: schema.lesson.id, chapterId: schema.lesson.chapterId })
        .from(schema.lesson)
        .where(
          inArray(
            schema.lesson.id,
            items.map(({ id }) => id)
          )
        );
      if (selected.length !== items.length) throw new NotFoundError("Lesson not found");
      const chapterIds = [...new Set(selected.map(({ chapterId }) => chapterId))];
      if (chapterIds.length !== 1) throw new BadRequestError("Lessons must belong to the same chapter");
      const [chapterRow] = await tx
        .select({ id: schema.chapter.id })
        .from(schema.chapter)
        .where(eq(schema.chapter.id, chapterIds[0]!))
        .for("update");
      if (!chapterRow) throw new NotFoundError("Chapter not found");
      const siblings = await tx
        .select({ id: schema.lesson.id, position: schema.lesson.position })
        .from(schema.lesson)
        .where(eq(schema.lesson.chapterId, chapterRow.id))
        .for("update");
      this.validateFinalPositions(items, siblings);
      for (const item of items) {
        await tx.update(schema.lesson).set({ position: item.position }).where(eq(schema.lesson.id, item.id));
      }
    });
  }

  private validateReorderItems(items: ReorderItem[]) {
    if (!items.length) throw new BadRequestError("At least one item is required");
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.id || ids.has(item.id)) throw new BadRequestError("IDs must be unique");
      if (!Number.isInteger(item.position) || item.position < 1) {
        throw new BadRequestError("Positions must be positive integers");
      }
      ids.add(item.id);
    }
  }

  private validateFinalPositions(items: ReorderItem[], siblings: Array<{ id: string; position: number }>) {
    const requested = new Map(items.map(({ id, position }) => [id, position]));
    const positions = new Set<number>();
    for (const sibling of siblings) {
      const position = requested.get(sibling.id) ?? sibling.position;
      if (positions.has(position)) throw new BadRequestError("Final sibling positions must be unique");
      positions.add(position);
    }
  }

  upsertLessonProgress(userId: string, lessonId: string) {
    return this.db
      .insert(schema.lessonProgress)
      .values({
        id: crypto.randomUUID(),
        userId,
        lessonId,
        completed: true,
      })
      .onConflictDoUpdate({
        target: [schema.lessonProgress.userId, schema.lessonProgress.lessonId],
        set: { completed: true },
      });
  }

  async createOrUpdatePendingEnrollment(userId: string, courseId: string, amount: number) {
    return this.db.transaction(async (tx) => {
      const existingEnrollment = await tx.query.enrollment.findFirst({
        where: and(eq(schema.enrollment.userId, userId), eq(schema.enrollment.courseId, courseId)),
      });

      if (existingEnrollment?.status === "Active") {
        return existingEnrollment;
      }

      if (existingEnrollment) {
        await tx
          .update(schema.enrollment)
          .set({ amount, status: "Pending" })
          .where(eq(schema.enrollment.id, existingEnrollment.id));
        return { ...existingEnrollment, amount, status: "Pending" as const };
      }

      const id = crypto.randomUUID();
      await tx.insert(schema.enrollment).values({
        id,
        userId,
        courseId,
        amount,
        status: "Pending",
      });
      return { id, userId, courseId, amount, status: "Pending" as const };
    });
  }

  async activateEnrollment(input: ActivationInput): Promise<"activated" | "already-active"> {
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) {
      throw new BadRequestError("Checkout amount is invalid");
    }

    return this.db.transaction(async (tx) => {
      const [enrollment] = await tx
        .select()
        .from(schema.enrollment)
        .where(eq(schema.enrollment.id, input.enrollmentId))
        .for("update");
      if (!enrollment) throw new NotFoundError("Enrollment not found");
      if (enrollment.userId !== input.userId) throw new ForbiddenError("Enrollment belongs to another user");
      if (enrollment.courseId !== input.courseId)
        throw new BadRequestError("Enrollment does not match the checkout course");

      if (enrollment.status === "Active") {
        if (enrollment.amount !== input.amountMinor)
          throw new BadRequestError("Checkout amount does not match the active enrollment");
        return "already-active";
      }
      if (enrollment.status !== "Pending") throw new BadRequestError("Enrollment cannot be activated");

      const expectedMinor = enrollment.amount * 100;
      if (!Number.isSafeInteger(expectedMinor) || input.amountMinor !== expectedMinor) {
        throw new BadRequestError("Checkout amount does not match the pending enrollment");
      }

      await tx
        .update(schema.enrollment)
        .set({ amount: input.amountMinor, status: "Active" })
        .where(eq(schema.enrollment.id, input.enrollmentId));
      return "activated";
    });
  }

  async getDashboardStats() {
    const [usersCount, customersCount, coursesCount, lessonsCount] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.user),
      this.db
        .select({
          count: sql<number>`count(distinct ${schema.enrollment.userId})::int`,
        })
        .from(schema.enrollment)
        .where(eq(schema.enrollment.status, "Active")),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.course),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.lesson),
    ]);

    return {
      totalSignups: usersCount[0]?.count || 0,
      totalCustomers: customersCount[0]?.count || 0,
      totalCourses: coursesCount[0]?.count || 0,
      totalLessons: lessonsCount[0]?.count || 0,
    };
  }

  findActiveEnrollmentsSince(date: Date) {
    return this.db.query.enrollment.findMany({
      where: and(gte(schema.enrollment.createdAt, date), eq(schema.enrollment.status, "Active")),
    });
  }
}
