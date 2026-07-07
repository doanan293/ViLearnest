import crypto from "node:crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import type { db as dbInstance } from "../index.js";
import * as schema from "../schema.js";

type Database = typeof dbInstance;

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

  findCourseBySlug(slug: string) {
    return this.db.query.course.findFirst({
      where: eq(schema.course.slug, slug),
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

  updateChapterPosition(id: string, position: number) {
    return this.db.update(schema.chapter).set({ position }).where(eq(schema.chapter.id, id));
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

  updateLessonPosition(id: string, position: number) {
    return this.db.update(schema.lesson).set({ position }).where(eq(schema.lesson.id, id));
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

  activateEnrollment(enrollmentId: string, userId: string, amount: number) {
    return this.db
      .update(schema.enrollment)
      .set({ userId, amount, status: "Active" })
      .where(eq(schema.enrollment.id, enrollmentId));
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
