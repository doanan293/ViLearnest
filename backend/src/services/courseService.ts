import crypto from "node:crypto";
import { config } from "../config/index.js";
import type { ActivationInput, CourseRepository, ReorderItem } from "../db/repository/courseRepository.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors.js";
import {
  type Locale,
  localizeChapter,
  localizeCourse,
  localizeCourseTree,
  localizeLesson,
  pickText,
} from "../lib/localize.js";
import type { CheckoutLineItem, CheckoutSession, StripeClient } from "../lib/stripe-client.js";

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

interface CourseInput {
  titleEn: string | null;
  titleVi: string | null;
  smallDescriptionEn: string | null;
  smallDescriptionVi: string | null;
  descriptionEn: string | null;
  descriptionVi: string | null;
  fileKey: string;
  price: number;
  duration: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
}

export interface BilingualName {
  nameEn?: string | null;
  nameVi?: string | null;
}

export interface LessonInput extends BilingualName {
  descriptionEn?: string | null;
  descriptionVi?: string | null;
  thumbnailKey?: string;
  videoKey?: string;
}

interface CheckoutCourse {
  title: string;
  price: number;
  stripePriceId: string;
}

function withTitle<T extends { titleEn: string | null; titleVi: string | null }>(row: T, locale: Locale) {
  return { ...row, title: pickText(row, "title", locale) ?? "" };
}

function requireTitle(titleEn: string | null | undefined, titleVi: string | null | undefined) {
  if (!titleEn?.trim() && !titleVi?.trim()) {
    throw new BadRequestError("A title is required in English or Vietnamese");
  }
}

export class CourseService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly stripe: StripeClient
  ) {}

  async listPublishedCourses(locale: Locale) {
    const courses = await this.courses.listPublishedCourses();
    return courses.map((course) => localizeCourse(course, locale));
  }

  async getCourseBySlug(slug: string, locale: Locale) {
    const course = await this.courses.findPublicCourseBySlug(slug);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return localizeCourseTree(course, locale);
  }

  async getSidebarData(slug: string, userId: string, locale: Locale) {
    const course = await this.courses.findCourseSidebarBySlug(slug, userId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    const enrollment = await this.courses.findEnrollment(userId, course.id);
    if (enrollment?.status !== "Active") {
      throw new ForbiddenError("Not enrolled in this course");
    }

    return { course: localizeCourseTree(course, locale) };
  }

  async getLessonContent(lessonId: string, userId: string, locale: Locale) {
    const lesson = await this.courses.findLessonContent(lessonId, userId);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    const enrollment = await this.courses.findEnrollment(userId, lesson.Chapter.courseId);
    if (enrollment?.status !== "Active") {
      throw new ForbiddenError("Not enrolled in this course");
    }

    return {
      ...localizeLesson(lesson, locale),
      Chapter: {
        ...localizeChapter(lesson.Chapter, locale),
        Course: localizeCourse(lesson.Chapter.Course, locale),
      },
    };
  }

  async listEnrolledCourses(userId: string, locale: Locale) {
    const enrollments = await this.courses.findActiveEnrollments(userId);
    return enrollments.map((enrollment) => ({
      ...enrollment,
      Course: localizeCourseTree(enrollment.Course, locale),
    }));
  }

  async isEnrolled(courseId: string, userId: string) {
    const enrollment = await this.courses.findEnrollment(userId, courseId);
    return { enrolled: enrollment?.status === "Active" };
  }

  async enroll(courseId: string, user: SessionUser, locale: Locale) {
    const course = await this.courses.findCourseById(courseId);
    if (!course) {
      return { status: "error" as const, message: "Course not found" };
    }

    const dbUser = await this.courses.findUserById(user.id);
    let stripeCustomerId = dbUser?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await this.courses.updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    const enrollment = await this.courses.createOrUpdatePendingEnrollment(user.id, course.id, course.price);

    if (enrollment.status === "Active") {
      return {
        status: "success" as const,
        message: "You are already enrolled in this course",
      };
    }

    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [this.buildCheckoutLineItem({ ...course, title: pickText(course, "title", locale) ?? course.slug })],
      mode: "payment",
      success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payment/cancel`,
      metadata: {
        userId: user.id,
        courseId: course.id,
        enrollmentId: enrollment.id,
      },
    });

    return {
      status: "success" as const,
      message: "Enrollment initialized successfully",
      checkoutUrl: checkoutSession.url ?? undefined,
    };
  }

  private buildCheckoutLineItem(course: CheckoutCourse): CheckoutLineItem {
    if (course.stripePriceId.startsWith("price_")) {
      return {
        price: course.stripePriceId,
        quantity: 1,
      };
    }

    return {
      price_data: {
        currency: "usd",
        product_data: { name: course.title },
        unit_amount: Math.round(course.price * 100),
      },
      quantity: 1,
    };
  }

  async confirmCheckoutSession(sessionId: string, userId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new BadRequestError("Stripe checkout session is not paid");
    }

    const metadataUserId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    const enrollmentId = session.metadata?.enrollmentId;
    const customerId = session.customer;

    if (!metadataUserId || !courseId || !enrollmentId || typeof customerId !== "string") {
      throw new BadRequestError("Stripe checkout session metadata is invalid");
    }

    if (metadataUserId !== userId) {
      throw new ForbiddenError("Stripe checkout session does not belong to this user");
    }

    const user = await this.courses.findUserByStripeCustomerId(customerId);
    if (!user) {
      throw new NotFoundError("User not found matching stripe customer");
    }

    if (user.id !== userId) {
      throw new ForbiddenError("Stripe customer does not belong to this user");
    }

    const activation = this.checkoutActivation({
      enrollmentId,
      userId: user.id,
      courseId,
      amountMinor: session.amount_total,
    });
    await this.courses.activateEnrollment(activation);
    return { status: "success" as const, message: "Enrollment activated successfully" };
  }

  private checkoutActivation(input: Omit<ActivationInput, "amountMinor"> & { amountMinor: number | null }) {
    if (input.amountMinor === null) throw new BadRequestError("Stripe checkout amount is missing");
    return input as ActivationInput;
  }

  async markComplete(lessonId: string, userId: string) {
    const lesson = await this.courses.findLessonAccess(lessonId);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    const enrollment = await this.courses.findEnrollment(userId, lesson.courseId);
    if (enrollment?.status !== "Active") {
      throw new ForbiddenError("Not enrolled in this course");
    }

    await this.courses.upsertLessonProgress(userId, lessonId);
    return { status: "success" as const, message: "Progress updated" };
  }

  async listAdminCourses(locale: Locale) {
    const courses = await this.courses.listAllCourses();
    return courses.map((course) => withTitle(course, locale));
  }

  // Admin reads keep both languages for editing and add a display title in the admin's UI language.
  async getAdminCourse(id: string, locale: Locale) {
    const course = await this.courses.findAdminCourseById(id);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return {
      ...withTitle(course, locale),
      chapter: course.chapter.map((chapter) => ({
        ...withTitle(chapter, locale),
        lessons: chapter.lessons.map((lesson) => withTitle(lesson, locale)),
      })),
    };
  }

  async getAdminLesson(id: string) {
    const lesson = await this.courses.findLessonById(id);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }
    return lesson;
  }

  async createCourse(input: CourseInput, userId: string) {
    requireTitle(input.titleEn, input.titleVi);
    await this.courses.createCourse({
      id: crypto.randomUUID(),
      ...input,
      price: Number(input.price),
      duration: Number(input.duration),
      stripePriceId: `mock-price-id-${input.slug}`,
      userId,
    });
    return { status: "success" as const, message: "Course created successfully" };
  }

  async updateCourse(id: string, input: CourseInput) {
    requireTitle(input.titleEn, input.titleVi);
    const course = await this.courses.findCourseById(id);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    await this.courses.updateCourse(id, {
      ...input,
      price: Number(input.price),
      duration: Number(input.duration),
    });
    return { status: "success" as const, message: "Course updated successfully" };
  }

  async deleteCourse(id: string) {
    await this.courses.deleteCourse(id);
    return { status: "success" as const, message: "Course deleted successfully" };
  }

  async createChapter(courseId: string, name: BilingualName) {
    requireTitle(name.nameEn, name.nameVi);
    const course = await this.courses.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    const position = await this.courses.getNextChapterPosition(courseId);
    const chapter = {
      id: crypto.randomUUID(),
      titleEn: name.nameEn || null,
      titleVi: name.nameVi || null,
      position,
      courseId,
    };
    await this.courses.createChapter(chapter);
    return {
      status: "success" as const,
      message: "Chapter created successfully",
      chapter: {
        id: chapter.id,
        title: pickText(chapter, "title", "en") ?? "",
        titleEn: chapter.titleEn,
        titleVi: chapter.titleVi,
        position: chapter.position,
      },
    };
  }

  async deleteChapter(chapterId: string) {
    await this.courses.deleteChapter(chapterId);
    return { status: "success" as const, message: "Chapter deleted successfully" };
  }

  async reorderChapters(chapters: ReorderItem[]) {
    await this.courses.reorderChapters(chapters);
    return { status: "success" as const, message: "Chapters reordered successfully" };
  }

  async createLesson(chapterId: string, name: BilingualName) {
    requireTitle(name.nameEn, name.nameVi);
    const position = await this.courses.getNextLessonPosition(chapterId);
    const lesson = {
      id: crypto.randomUUID(),
      titleEn: name.nameEn || null,
      titleVi: name.nameVi || null,
      position,
      chapterId,
    };
    await this.courses.createLesson(lesson);
    return {
      status: "success" as const,
      message: "Lesson created successfully",
      lesson: {
        id: lesson.id,
        title: pickText(lesson, "title", "en") ?? "",
        titleEn: lesson.titleEn,
        titleVi: lesson.titleVi,
        position: lesson.position,
      },
    };
  }

  async updateLesson(lessonId: string, input: LessonInput) {
    const lesson = await this.courses.findLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }
    // Only fields the request carries are written, so editing one language keeps the other.
    const changes = {
      titleEn: input.nameEn === undefined ? undefined : input.nameEn || null,
      titleVi: input.nameVi === undefined ? undefined : input.nameVi || null,
      descriptionEn: input.descriptionEn === undefined ? undefined : input.descriptionEn || null,
      descriptionVi: input.descriptionVi === undefined ? undefined : input.descriptionVi || null,
      thumbnailKey: input.thumbnailKey,
      videoKey: input.videoKey,
    };
    requireTitle(
      changes.titleEn === undefined ? lesson.titleEn : changes.titleEn,
      changes.titleVi === undefined ? lesson.titleVi : changes.titleVi
    );
    await this.courses.updateLesson(
      lessonId,
      Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined))
    );
    return { status: "success" as const, message: "Lesson updated successfully" };
  }

  async deleteLesson(lessonId: string) {
    await this.courses.deleteLesson(lessonId);
    return { status: "success" as const, message: "Lesson deleted successfully" };
  }

  async reorderLessons(lessons: ReorderItem[]) {
    await this.courses.reorderLessons(lessons);
    return { status: "success" as const, message: "Lessons reordered successfully" };
  }

  getDashboardStats() {
    return this.courses.getDashboardStats();
  }

  async getEnrollmentStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const enrollments = await this.courses.findActiveEnrollmentsSince(thirtyDaysAgo);

    const last30Days: { date: string; enrollments: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push({
        date: date.toISOString().split("T")[0],
        enrollments: 0,
      });
    }

    for (const enrollment of enrollments) {
      const date = enrollment.createdAt.toISOString().split("T")[0];
      const day = last30Days.find((entry) => entry.date === date);
      if (day) {
        day.enrollments++;
      }
    }

    return last30Days;
  }

  async listRecentCourses(locale: Locale) {
    const courses = await this.courses.listRecentCourses();
    return courses.map((course) => withTitle(course, locale));
  }

  async handleCheckoutCompleted(session: CheckoutSession) {
    if (session.payment_status !== "paid") return;

    const courseId = session.metadata?.courseId;
    const enrollmentId = session.metadata?.enrollmentId;
    const metadataUserId = session.metadata?.userId;
    const customerId = session.customer;

    if (!courseId || !enrollmentId || !metadataUserId || typeof customerId !== "string") {
      throw new BadRequestError("Stripe checkout session metadata is invalid");
    }

    const user = await this.courses.findUserByStripeCustomerId(customerId);
    if (!user) {
      throw new NotFoundError("User not found matching stripe customer");
    }

    if (metadataUserId !== user.id)
      throw new ForbiddenError("Stripe checkout session metadata does not match its customer");
    await this.courses.activateEnrollment(
      this.checkoutActivation({
        enrollmentId,
        userId: user.id,
        courseId,
        amountMinor: session.amount_total,
      })
    );
  }
}
