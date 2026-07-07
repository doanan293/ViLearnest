import type * as schema from "../db/schema.js";

export const BRUNO_USER_EMAIL = "bruno-user@example.com";
export const BRUNO_ADMIN_EMAIL = "bruno-admin@example.com";
export const BRUNO_AUTH_LIFECYCLE_EMAIL = "bruno-auth-lifecycle@example.com";
export const BRUNO_OWNED_EMAILS = [BRUNO_USER_EMAIL, BRUNO_ADMIN_EMAIL, BRUNO_AUTH_LIFECYCLE_EMAIL] as const;

export const BRUNO_SEED_IDS = {
  user: "bruno-user",
  admin: "bruno-admin",
  course: "bruno-seeded-enrolled-course",
  chapter: "bruno-seeded-enrolled-chapter",
  lesson: "bruno-seeded-enrolled-lesson",
  enrollment: "bruno-seeded-enrollment",
  lessonProgress: "bruno-seeded-lesson-progress",
  paymentCourse: "bruno-payment-course",
  paymentChapter: "bruno-payment-chapter",
  paymentLesson: "bruno-payment-lesson",
  unenrolledCourse: "bruno-unenrolled-course",
  unenrolledChapter: "bruno-unenrolled-chapter",
  unenrolledLesson: "bruno-unenrolled-lesson",
} as const;

type PasswordEnv = {
  BRUNO_TEST_PASSWORD?: string;
};

export function getBrunoPassword(env: PasswordEnv = process.env) {
  return env.BRUNO_TEST_PASSWORD?.trim() || "BrunoPass123!";
}

export function tipTapDocument(text: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
}

export function buildBrunoSeedRows(passwordHash: string, now = new Date()) {
  const users: Array<typeof schema.user.$inferInsert> = [
    {
      id: BRUNO_SEED_IDS.user,
      name: "Bruno Learner",
      email: BRUNO_USER_EMAIL,
      emailVerified: true,
      image: null,
      role: "user",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: BRUNO_SEED_IDS.admin,
      name: "Bruno Admin",
      email: BRUNO_ADMIN_EMAIL,
      emailVerified: true,
      image: null,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const accounts: Array<typeof schema.account.$inferInsert> = users.map((seedUser) => ({
    id: `${seedUser.id}-credential`,
    accountId: seedUser.id,
    providerId: "credential",
    userId: seedUser.id,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  }));

  const userProfiles: Array<typeof schema.userProfile.$inferInsert> = [
    {
      userId: BRUNO_SEED_IDS.user,
      phoneVerified: false,
      country: "Vietnam",
      province: "Ho Chi Minh City",
      occupation: "QA Automation Learner",
      organization: "ANDV LMS",
      bio: "Seeded learner profile for Bruno API automation.",
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: BRUNO_SEED_IDS.admin,
      phoneVerified: false,
      occupation: "LMS Administrator",
      organization: "ANDV LMS",
      bio: "Seeded admin profile for Bruno API automation.",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const course: typeof schema.course.$inferInsert = {
    id: BRUNO_SEED_IDS.course,
    title: "Bruno Seeded Enrolled Course",
    description: tipTapDocument("Seeded course used for authenticated course-player API automation."),
    fileKey: "bruno-fixtures/seeded-course-cover.png",
    price: 0,
    duration: 30,
    level: "Beginner",
    stripePriceId: "bruno-seeded-enrolled-price",
    category: "Testing",
    smallDescription: "Seeded enrolled course for Bruno API automation.",
    slug: "bruno-seeded-enrolled-course",
    status: "Published",
    userId: BRUNO_SEED_IDS.admin,
    createdAt: now,
    updatedAt: now,
  };

  const chapter: typeof schema.chapter.$inferInsert = {
    id: BRUNO_SEED_IDS.chapter,
    title: "Seeded Chapter",
    position: 1,
    courseId: BRUNO_SEED_IDS.course,
    createdAt: now,
    updatedAt: now,
  };

  const lesson: typeof schema.lesson.$inferInsert = {
    id: BRUNO_SEED_IDS.lesson,
    title: "Seeded Lesson",
    description: tipTapDocument("Seeded lesson used for authenticated lesson content checks."),
    thumbnailKey: "bruno-fixtures/seeded-lesson-thumbnail.png",
    videoKey: "bruno-fixtures/seeded-lesson-video.mp4",
    position: 1,
    chapterId: BRUNO_SEED_IDS.chapter,
    createdAt: now,
    updatedAt: now,
  };

  const paymentCourse: typeof schema.course.$inferInsert = {
    id: BRUNO_SEED_IDS.paymentCourse,
    title: "Bruno Payment Course",
    description: tipTapDocument("Published course used for Bruno payment API automation."),
    fileKey: "bruno-fixtures/payment-course-cover.png",
    price: 49,
    duration: 20,
    level: "Beginner",
    stripePriceId: "bruno-payment-course-price",
    category: "Testing",
    smallDescription: "Payment workflow course for Bruno API automation.",
    slug: "bruno-payment-course",
    status: "Published",
    userId: BRUNO_SEED_IDS.admin,
    createdAt: now,
    updatedAt: now,
  };

  const paymentChapter: typeof schema.chapter.$inferInsert = {
    id: BRUNO_SEED_IDS.paymentChapter,
    title: "Payment Chapter",
    position: 1,
    courseId: BRUNO_SEED_IDS.paymentCourse,
    createdAt: now,
    updatedAt: now,
  };

  const paymentLesson: typeof schema.lesson.$inferInsert = {
    id: BRUNO_SEED_IDS.paymentLesson,
    title: "Payment Lesson",
    description: tipTapDocument("Lesson unlocked after Bruno payment webhook activation."),
    thumbnailKey: "bruno-fixtures/payment-lesson-thumbnail.png",
    videoKey: "bruno-fixtures/payment-lesson-video.mp4",
    position: 1,
    chapterId: BRUNO_SEED_IDS.paymentChapter,
    createdAt: now,
    updatedAt: now,
  };

  const unenrolledCourse: typeof schema.course.$inferInsert = {
    id: BRUNO_SEED_IDS.unenrolledCourse,
    title: "Bruno Unenrolled Course",
    description: tipTapDocument("Published course used for Bruno not-enrolled API automation."),
    fileKey: "bruno-fixtures/unenrolled-course-cover.png",
    price: 0,
    duration: 15,
    level: "Beginner",
    stripePriceId: "bruno-unenrolled-course-price",
    category: "Testing",
    smallDescription: "Not-enrolled boundary course for Bruno API automation.",
    slug: "bruno-unenrolled-course",
    status: "Published",
    userId: BRUNO_SEED_IDS.admin,
    createdAt: now,
    updatedAt: now,
  };

  const unenrolledChapter: typeof schema.chapter.$inferInsert = {
    id: BRUNO_SEED_IDS.unenrolledChapter,
    title: "Unenrolled Chapter",
    position: 1,
    courseId: BRUNO_SEED_IDS.unenrolledCourse,
    createdAt: now,
    updatedAt: now,
  };

  const unenrolledLesson: typeof schema.lesson.$inferInsert = {
    id: BRUNO_SEED_IDS.unenrolledLesson,
    title: "Unenrolled Lesson",
    description: tipTapDocument("Lesson used to verify not-enrolled users cannot read content."),
    thumbnailKey: "bruno-fixtures/unenrolled-lesson-thumbnail.png",
    videoKey: "bruno-fixtures/unenrolled-lesson-video.mp4",
    position: 1,
    chapterId: BRUNO_SEED_IDS.unenrolledChapter,
    createdAt: now,
    updatedAt: now,
  };

  const enrollment: typeof schema.enrollment.$inferInsert = {
    id: BRUNO_SEED_IDS.enrollment,
    amount: 0,
    status: "Active",
    courseId: BRUNO_SEED_IDS.course,
    userId: BRUNO_SEED_IDS.user,
    createdAt: now,
    updatedAt: now,
  };

  const lessonProgress: typeof schema.lessonProgress.$inferInsert = {
    id: BRUNO_SEED_IDS.lessonProgress,
    completed: false,
    userId: BRUNO_SEED_IDS.user,
    lessonId: BRUNO_SEED_IDS.lesson,
    createdAt: now,
    updatedAt: now,
  };

  return {
    users,
    accounts,
    userProfiles,
    course,
    chapter,
    lesson,
    paymentCourse,
    paymentChapter,
    paymentLesson,
    unenrolledCourse,
    unenrolledChapter,
    unenrolledLesson,
    enrollment,
    lessonProgress,
  };
}
