import { describe, expect, it, jest } from "@jest/globals";
import type Stripe from "stripe";
import type { CourseRepository } from "../src/db/repository/courseRepository.js";
import { CourseService } from "../src/services/courseService.js";

const existingCourse = {
  id: "course-1",
  title: "Course 1",
  description: "Description",
  fileKey: "thumbnail.jpg",
  price: 100,
  duration: 10,
  level: "Beginner" as const,
  stripePriceId: "price_1",
  category: "Development",
  smallDescription: "Small description",
  slug: "course-1",
  status: "Draft" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  userId: "user-1",
};

function createRepository(overrides: Partial<Record<keyof CourseRepository, unknown>> = {}) {
  return {
    findCourseById: jest.fn(async () => existingCourse),
    findUserById: jest.fn(async () => ({ id: "user-1", stripeCustomerId: "cus_123" })),
    createOrUpdatePendingEnrollment: jest.fn(async () => ({
      id: "enrollment-1",
      userId: "user-1",
      courseId: "course-1",
      amount: 100,
      status: "Pending" as const,
    })),
    getNextChapterPosition: jest.fn(async () => 3),
    createChapter: jest.fn(async () => undefined),
    getNextLessonPosition: jest.fn(async () => 4),
    createLesson: jest.fn(async () => undefined),
    createCourse: jest.fn(async () => undefined),
    ...overrides,
  };
}

function createStripe(overrides: Partial<Stripe> = {}) {
  return {
    customers: {
      create: jest.fn(async () => ({ id: "cus_created" })),
    },
    checkout: {
      sessions: {
        create: jest.fn(async () => ({ url: "https://checkout.stripe.test/session" })),
        retrieve: jest.fn(async () => ({
          payment_status: "paid",
          amount_total: 3900,
          customer: "cus_123",
          metadata: {
            userId: "user-1",
            courseId: "course-1",
            enrollmentId: "enrollment-1",
          },
        })),
      },
    },
    ...overrides,
  } as unknown as Stripe;
}

function createService(repository: ReturnType<typeof createRepository>, stripe = createStripe()) {
  // CourseService only uses the mocked repository methods in these tests.
  return new CourseService(repository as unknown as CourseRepository, stripe);
}

describe("CourseService", () => {
  it("uses a unique mock stripe price id based on slug when creating a course", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.createCourse(
      {
        title: "Bruno API Automation Course",
        description: '{"type":"doc","content":[]}',
        fileKey: "uploads/bruno-course-cover.png",
        price: 0,
        duration: 45,
        level: "Beginner",
        category: "Testing",
        smallDescription: "Course created by Bruno API automation.",
        slug: "bruno-api-automation-course",
        status: "Published",
      },
      "admin-1"
    );

    expect(repository.createCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        stripePriceId: "mock-price-id-bruno-api-automation-course",
        slug: "bruno-api-automation-course",
        userId: "admin-1",
      })
    );
  });

  it("lets the database set timestamps when creating a chapter", async () => {
    const repository = createRepository();
    const service = createService(repository);

    const result = await service.createChapter("course-1", "Chapter 3");

    expect(repository.createChapter).toHaveBeenCalledWith({
      id: expect.any(String),
      title: "Chapter 3",
      position: 3,
      courseId: "course-1",
    });
    expect(result).toMatchObject({
      status: "success",
      message: "Chapter created successfully",
      chapter: {
        id: expect.any(String),
        title: "Chapter 3",
        position: 3,
      },
    });
  });

  it("lets the database set timestamps when creating a lesson", async () => {
    const repository = createRepository();
    const service = createService(repository);

    const result = await service.createLesson("chapter-1", "Lesson 4");

    expect(repository.createLesson).toHaveBeenCalledWith({
      id: expect.any(String),
      title: "Lesson 4",
      position: 4,
      chapterId: "chapter-1",
    });
    expect(result).toMatchObject({
      status: "success",
      message: "Lesson created successfully",
      lesson: {
        id: expect.any(String),
        title: "Lesson 4",
        position: 4,
      },
    });
  });

  it("uses stored Stripe price IDs for checkout when they are real price IDs", async () => {
    const repository = createRepository();
    const stripe = createStripe();
    const service = createService(repository, stripe);

    await service.enroll("course-1", { id: "user-1", email: "user@example.com", name: "User" });

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        line_items: [
          {
            price: "price_1",
            quantity: 1,
          },
        ],
      })
    );
  });

  it("uses inline Stripe price data for local mock course price IDs", async () => {
    const repository = createRepository({
      findCourseById: jest.fn(async () => ({
        ...existingCourse,
        title: "AI Fast",
        price: 39,
        stripePriceId: "mock-price-ai-fast",
      })),
      createOrUpdatePendingEnrollment: jest.fn(async () => ({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "course-1",
        amount: 39,
        status: "Pending" as const,
      })),
    });
    const stripe = createStripe();
    const service = createService(repository, stripe);

    await service.enroll("course-1", { id: "user-1", email: "user@example.com", name: "User" });

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "AI Fast" },
              unit_amount: 3900,
            },
            quantity: 1,
          },
        ],
      })
    );
  });

  it("confirms a paid checkout session for the current user", async () => {
    const repository = createRepository({
      findUserByStripeCustomerId: jest.fn(async () => ({ id: "user-1" })),
      activateEnrollment: jest.fn(async () => undefined),
    });
    const stripe = createStripe();
    const service = createService(repository, stripe);

    await expect(service.confirmCheckoutSession("cs_test_123", "user-1")).resolves.toEqual({
      status: "success",
      message: "Enrollment activated successfully",
    });

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_test_123");
    expect(repository.activateEnrollment).toHaveBeenCalledWith("enrollment-1", "user-1", 3900);
  });

  it("rejects checkout session confirmation for a different user", async () => {
    const repository = createRepository({
      findUserByStripeCustomerId: jest.fn(async () => ({ id: "user-1" })),
      activateEnrollment: jest.fn(async () => undefined),
    });
    const stripe = createStripe();
    const service = createService(repository, stripe);

    await expect(service.confirmCheckoutSession("cs_test_123", "other-user")).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(repository.activateEnrollment).not.toHaveBeenCalled();
  });
});
