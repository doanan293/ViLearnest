import { describe, expect, it, jest } from "@jest/globals";
import type Stripe from "stripe";
import type { CourseRepository } from "../../src/db/repository/courseRepository.js";
import { CourseService } from "../../src/services/courseService.js";

const existingCourse = {
  id: "course-1",
  titleEn: "Course 1",
  titleVi: null as string | null,
  descriptionEn: "Description",
  descriptionVi: null as string | null,
  fileKey: "thumbnail.jpg",
  price: 100,
  duration: 10,
  level: "Beginner" as const,
  stripePriceId: "price_1",
  category: "Development",
  smallDescriptionEn: "Small description",
  smallDescriptionVi: null as string | null,
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

const publicCourse = {
  id: "course-1",
  titleEn: "AI Fast",
  titleVi: "AI Nhanh",
  smallDescriptionEn: "Learn fast",
  smallDescriptionVi: "Học nhanh",
  descriptionEn: '{"type":"doc"}',
  descriptionVi: null,
  fileKey: "cover.jpg",
  price: 39,
  duration: 33,
  level: "Intermediate" as const,
  category: "Development",
  slug: "ai-fast",
  chapter: [
    {
      id: "chapter-1",
      position: 1,
      titleEn: "Chapter 1: Basics",
      titleVi: "Chương 1: Cơ bản",
      lessons: [{ id: "lesson-1", position: 1, titleEn: "The CLAUDE.md file", titleVi: null }],
    },
  ],
};

describe("CourseService localized reads", () => {
  it("returns the Vietnamese course text for vi", async () => {
    const service = createService(createRepository({ findPublicCourseBySlug: jest.fn(async () => publicCourse) }));

    const course = await service.getCourseBySlug("ai-fast", "vi");

    expect(course).toMatchObject({ title: "AI Nhanh", smallDescription: "Học nhanh", description: '{"type":"doc"}' });
    expect(course).not.toHaveProperty("titleEn");
  });

  it("returns the English course text for en", async () => {
    const service = createService(createRepository({ findPublicCourseBySlug: jest.fn(async () => publicCourse) }));

    const course = await service.getCourseBySlug("ai-fast", "en");

    expect(course).toMatchObject({ title: "AI Fast", smallDescription: "Learn fast" });
  });

  it("falls back to Vietnamese when the course has no English title", async () => {
    const service = createService(
      createRepository({ findPublicCourseBySlug: jest.fn(async () => ({ ...publicCourse, titleEn: null })) })
    );

    const course = await service.getCourseBySlug("ai-fast", "en");

    expect(course.title).toBe("AI Nhanh");
  });

  it("localizes chapter and lesson titles in the sidebar", async () => {
    const sidebarCourse = {
      ...publicCourse,
      chapter: [
        {
          ...publicCourse.chapter[0],
          lessons: [
            { ...publicCourse.chapter[0]!.lessons[0], descriptionEn: null, descriptionVi: null, lessonProgess: [] },
          ],
        },
      ],
    };
    const service = createService(
      createRepository({
        findCourseSidebarBySlug: jest.fn(async () => sidebarCourse),
        findEnrollment: jest.fn(async () => ({ status: "Active" })),
      })
    );

    const { course } = await service.getSidebarData("ai-fast", "user-1", "vi");

    expect(course.chapter[0]).toMatchObject({ title: "Chương 1: Cơ bản" });
    expect(course.chapter[0]!.lessons[0]).toMatchObject({ title: "The CLAUDE.md file", lessonProgess: [] });
  });
});

const courseInput = {
  titleEn: "Course A" as string | null,
  titleVi: null as string | null,
  smallDescriptionEn: "Short" as string | null,
  smallDescriptionVi: null as string | null,
  descriptionEn: '{"type":"doc","content":[]}' as string | null,
  descriptionVi: null as string | null,
  fileKey: "uploads/cover.png",
  price: 0,
  duration: 45,
  level: "Beginner" as const,
  category: "Testing",
  slug: "course-a",
  status: "Published" as const,
};

describe("CourseService bilingual admin writes", () => {
  it("stores a Vietnamese-only course with an empty English title", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.createCourse({ ...courseInput, titleEn: null, titleVi: "Khóa A" }, "admin-1");

    expect(repository.createCourse).toHaveBeenCalledWith(expect.objectContaining({ titleEn: null, titleVi: "Khóa A" }));
  });

  it("rejects a course without a title in either language", async () => {
    const service = createService(createRepository());

    await expect(service.createCourse({ ...courseInput, titleEn: "", titleVi: null }, "admin-1")).rejects.toThrow(
      "A title is required in English or Vietnamese"
    );
  });

  it("writes both languages when updating a course", async () => {
    const repository = createRepository({ updateCourse: jest.fn(async () => undefined) });
    const service = createService(repository);

    await service.updateCourse("course-1", { ...courseInput, titleVi: "Khóa A" });

    expect(repository.updateCourse).toHaveBeenCalledWith(
      "course-1",
      expect.objectContaining({ titleEn: "Course A", titleVi: "Khóa A" })
    );
  });

  it("stores a Vietnamese-only chapter name in titleVi", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.createChapter("course-1", { nameEn: null, nameVi: "Chương 1" });

    expect(repository.createChapter).toHaveBeenCalledWith(
      expect.objectContaining({ titleEn: null, titleVi: "Chương 1" })
    );
  });

  it("does not erase the other language when a lesson update sends one language", async () => {
    const repository = createRepository({
      findLessonById: jest.fn(async () => ({ id: "lesson-1" })),
      updateLesson: jest.fn(async () => undefined),
    });
    const service = createService(repository);

    await service.updateLesson("lesson-1", { nameEn: "Hooks" });

    const written = (repository.updateLesson as jest.Mock).mock.calls[0]![1] as Record<string, unknown>;
    expect(written.titleEn).toBe("Hooks");
    expect(written).not.toHaveProperty("titleVi");
    expect(written).not.toHaveProperty("descriptionVi");
  });

  it("names the Stripe product in the buyer's language", async () => {
    const repository = createRepository({
      findCourseById: jest.fn(async () => ({
        ...existingCourse,
        titleEn: "AI Fast",
        titleVi: "AI Nhanh",
        price: 39,
        stripePriceId: "mock-price-ai-fast",
      })),
    });
    const stripe = createStripe();
    const service = createService(repository, stripe);

    await service.enroll("course-1", { id: "user-1", email: "user@example.com", name: "User" }, "vi");

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({ price_data: expect.objectContaining({ product_data: { name: "AI Nhanh" } }) }),
        ],
      })
    );
  });
});

describe("CourseService", () => {
  it("uses a unique mock stripe price id based on slug when creating a course", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.createCourse(
      {
        ...courseInput,
        titleEn: "Bruno API Automation Course",
        slug: "bruno-api-automation-course",
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

    const result = await service.createChapter("course-1", { nameEn: "Chapter 3", nameVi: null });

    expect(repository.createChapter).toHaveBeenCalledWith({
      id: expect.any(String),
      titleEn: "Chapter 3",
      titleVi: null,
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

    const result = await service.createLesson("chapter-1", { nameEn: "Lesson 4", nameVi: null });

    expect(repository.createLesson).toHaveBeenCalledWith({
      id: expect.any(String),
      titleEn: "Lesson 4",
      titleVi: null,
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

    await service.enroll("course-1", { id: "user-1", email: "user@example.com", name: "User" }, "en");

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
        titleEn: "AI Fast",
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

    await service.enroll("course-1", { id: "user-1", email: "user@example.com", name: "User" }, "en");

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
    expect(repository.activateEnrollment).toHaveBeenCalledWith({
      enrollmentId: "enrollment-1",
      userId: "user-1",
      courseId: "course-1",
      amountMinor: 3900,
    });
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
