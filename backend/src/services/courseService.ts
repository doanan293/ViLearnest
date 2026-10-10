import crypto from "node:crypto";
import type Stripe from "stripe";
import { config } from "../config/index.js";
import type { ActivationInput, CourseRepository, ReorderItem } from "../db/repository/courseRepository.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors.js";

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

interface CourseInput {
  title: string;
  description: string;
  fileKey: string;
  price: number;
  duration: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  smallDescription: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
}

interface CheckoutCourse {
  title: string;
  price: number;
  stripePriceId: string;
}

export class CourseService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly stripe: Stripe
  ) {}

  listPublishedCourses() {
    return this.courses.listPublishedCourses();
  }

  async getCourseBySlug(slug: string) {
    const course = await this.courses.findPublicCourseBySlug(slug);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return course;
  }

  async getSidebarData(slug: string, userId: string) {
    const course = await this.courses.findCourseSidebarBySlug(slug, userId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    const enrollment = await this.courses.findEnrollment(userId, course.id);
    if (enrollment?.status !== "Active") {
      throw new ForbiddenError("Not enrolled in this course");
    }

    return { course };
  }

  async getLessonContent(lessonId: string, userId: string) {
    const lesson = await this.courses.findLessonContent(lessonId, userId);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    const enrollment = await this.courses.findEnrollment(userId, lesson.Chapter.courseId);
    if (enrollment?.status !== "Active") {
      throw new ForbiddenError("Not enrolled in this course");
    }

    return lesson;
  }

  listEnrolledCourses(userId: string) {
    return this.courses.findActiveEnrollments(userId);
  }

  async isEnrolled(courseId: string, userId: string) {
    const enrollment = await this.courses.findEnrollment(userId, courseId);
    return { enrolled: enrollment?.status === "Active" };
  }

  async enroll(courseId: string, user: SessionUser) {
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
      line_items: [this.buildCheckoutLineItem(course)],
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

  private buildCheckoutLineItem(course: CheckoutCourse): Stripe.Checkout.SessionCreateParams.LineItem {
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

  listAdminCourses() {
    return this.courses.listAllCourses();
  }

  async getAdminCourse(id: string) {
    const course = await this.courses.findAdminCourseById(id);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return course;
  }

  async getAdminLesson(id: string) {
    const lesson = await this.courses.findLessonById(id);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }
    return lesson;
  }

  async createCourse(input: CourseInput, userId: string) {
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

  async createChapter(courseId: string, name: string) {
    const course = await this.courses.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    const position = await this.courses.getNextChapterPosition(courseId);
    const chapter = {
      id: crypto.randomUUID(),
      title: name,
      position,
      courseId,
    };
    await this.courses.createChapter(chapter);
    return {
      status: "success" as const,
      message: "Chapter created successfully",
      chapter: {
        id: chapter.id,
        title: chapter.title,
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

  async createLesson(chapterId: string, name: string) {
    const position = await this.courses.getNextLessonPosition(chapterId);
    const lesson = {
      id: crypto.randomUUID(),
      title: name,
      position,
      chapterId,
    };
    await this.courses.createLesson(lesson);
    return {
      status: "success" as const,
      message: "Lesson created successfully",
      lesson: {
        id: lesson.id,
        title: lesson.title,
        position: lesson.position,
      },
    };
  }

  async updateLesson(
    lessonId: string,
    input: {
      name: string;
      description?: string;
      thumbnailKey?: string;
      videoKey?: string;
    }
  ) {
    const lesson = await this.courses.findLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }
    await this.courses.updateLesson(lessonId, {
      title: input.name,
      description: input.description,
      thumbnailKey: input.thumbnailKey,
      videoKey: input.videoKey,
    });
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

  listRecentCourses() {
    return this.courses.listRecentCourses();
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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
