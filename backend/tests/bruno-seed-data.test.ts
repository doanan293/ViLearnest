import { describe, expect, it } from "@jest/globals";
import {
  BRUNO_ADMIN_EMAIL,
  BRUNO_AUTH_LIFECYCLE_EMAIL,
  BRUNO_OWNED_EMAILS,
  BRUNO_SEED_IDS,
  BRUNO_USER_EMAIL,
  buildBrunoSeedRows,
  getBrunoPassword,
} from "../src/scripts/brunoSeedData.js";

describe("bruno seed data", () => {
  it("builds verified users, credential accounts, and an active enrolled course", () => {
    const now = new Date("2026-07-04T00:00:00.000Z");
    const rows = buildBrunoSeedRows("hashed-password", now);

    expect(rows.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: BRUNO_SEED_IDS.user,
          email: BRUNO_USER_EMAIL,
          emailVerified: true,
          role: "user",
        }),
        expect.objectContaining({
          id: BRUNO_SEED_IDS.admin,
          email: BRUNO_ADMIN_EMAIL,
          emailVerified: true,
          role: "admin",
        }),
      ])
    );

    expect(rows.accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: BRUNO_SEED_IDS.user,
          providerId: "credential",
          password: "hashed-password",
        }),
        expect.objectContaining({
          userId: BRUNO_SEED_IDS.admin,
          providerId: "credential",
          password: "hashed-password",
        }),
      ])
    );

    expect(rows.course).toMatchObject({
      id: BRUNO_SEED_IDS.course,
      slug: "bruno-seeded-enrolled-course",
      status: "Published",
      stripePriceId: "bruno-seeded-enrolled-price",
      userId: BRUNO_SEED_IDS.admin,
    });
    expect(rows.enrollment).toMatchObject({
      userId: BRUNO_SEED_IDS.user,
      courseId: BRUNO_SEED_IDS.course,
      status: "Active",
    });
    expect(rows.paymentCourse).toMatchObject({
      id: BRUNO_SEED_IDS.paymentCourse,
      slug: "bruno-payment-course",
      status: "Published",
      stripePriceId: "bruno-payment-course-price",
      userId: BRUNO_SEED_IDS.admin,
    });
    expect(rows.paymentChapter).toMatchObject({
      id: BRUNO_SEED_IDS.paymentChapter,
      courseId: BRUNO_SEED_IDS.paymentCourse,
      position: 1,
    });
    expect(rows.paymentLesson).toMatchObject({
      id: BRUNO_SEED_IDS.paymentLesson,
      chapterId: BRUNO_SEED_IDS.paymentChapter,
      position: 1,
    });
    expect(BRUNO_OWNED_EMAILS).toContain(BRUNO_AUTH_LIFECYCLE_EMAIL);
    expect(rows.unenrolledCourse).toMatchObject({
      id: BRUNO_SEED_IDS.unenrolledCourse,
      slug: "bruno-unenrolled-course",
      status: "Published",
      stripePriceId: "bruno-unenrolled-course-price",
      userId: BRUNO_SEED_IDS.admin,
    });
    expect(rows.unenrolledChapter).toMatchObject({
      id: BRUNO_SEED_IDS.unenrolledChapter,
      courseId: BRUNO_SEED_IDS.unenrolledCourse,
      position: 1,
    });
    expect(rows.unenrolledLesson).toMatchObject({
      id: BRUNO_SEED_IDS.unenrolledLesson,
      chapterId: BRUNO_SEED_IDS.unenrolledChapter,
      position: 1,
    });
    expect(rows).not.toHaveProperty("paymentEnrollment");
    expect(rows.lessonProgress.completed).toBe(false);
  });

  it("uses the default local password unless BRUNO_TEST_PASSWORD is provided", () => {
    expect(getBrunoPassword({})).toBe("BrunoPass123!");
    expect(getBrunoPassword({ BRUNO_TEST_PASSWORD: "CustomPass123!" })).toBe("CustomPass123!");
  });
});
