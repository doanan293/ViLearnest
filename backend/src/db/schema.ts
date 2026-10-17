import { relations, sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// --- ENUMS ---
export const courseLevelEnum = pgEnum("CourseLevel", ["Beginner", "Intermediate", "Advanced"]);
export const courseStatusEnum = pgEnum("CourseStatus", ["Draft", "Published", "Archived"]);
export const enrollmentStatusEnum = pgEnum("EnrollmentStatus", ["Pending", "Active", "Cancelled"]);

// --- AUTH TABLES ---
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    stripeCustomerId: text("stripeCustomerId"),
    role: text("role"),
    banned: boolean("banned").default(false),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires", { mode: "date" }),
  },
  (table) => {
    return {
      emailUnique: uniqueIndex("user_email_key").on(table.email),
    };
  }
);

export const userProfile = pgTable("user_profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dateOfBirth: timestamp("dateOfBirth", { mode: "date" }),
  gender: text("gender"),
  phoneNumber: text("phoneNumber"),
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  country: text("country"),
  province: text("province"),
  district: text("district"),
  ward: text("ward"),
  addressLine: text("addressLine"),
  bio: text("bio"),
  facebookUrl: text("facebookUrl"),
  linkedinUrl: text("linkedinUrl"),
  githubUrl: text("githubUrl"),
  websiteUrl: text("websiteUrl"),
  occupation: text("occupation"),
  organization: text("organization"),
  education: text("education"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy"),
  },
  (table) => {
    return {
      tokenUnique: uniqueIndex("session_token_key").on(table.token),
      userIdIdx: index("session_userId_idx").on(table.userId),
    };
  }
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("account_userId_idx").on(table.userId),
    };
  }
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      identifierIdx: index("verification_identifier_idx").on(table.identifier),
    };
  }
);

// --- LMS TABLES ---
export const course = pgTable(
  "Course",
  {
    id: text("id").primaryKey(),
    titleEn: text("titleEn"),
    titleVi: text("titleVi"),
    descriptionEn: text("descriptionEn"),
    descriptionVi: text("descriptionVi"),
    fileKey: text("fileKey").notNull(),
    price: integer("price").notNull(),
    duration: integer("duration").notNull(),
    level: courseLevelEnum("level").default("Beginner").notNull(),
    stripePriceId: text("stripePriceId").notNull(),
    category: text("category").notNull(),
    smallDescriptionEn: text("smallDescriptionEn"),
    smallDescriptionVi: text("smallDescriptionVi"),
    slug: text("slug").notNull(),
    status: courseStatusEnum("status").default("Draft").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      slugUnique: uniqueIndex("Course_slug_key").on(table.slug),
      stripePriceIdUnique: uniqueIndex("Course_stripePriceId_key").on(table.stripePriceId),
      titleRequired: check(
        "Course_title_required",
        sql`coalesce(nullif(trim(${table.titleEn}), ''), nullif(trim(${table.titleVi}), '')) is not null`
      ),
    };
  }
);

export const chapter = pgTable(
  "Chapter",
  {
    id: text("id").primaryKey(),
    titleEn: text("titleEn"),
    titleVi: text("titleVi"),
    position: integer("position").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    courseId: text("courseId")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "Chapter_title_required",
      sql`coalesce(nullif(trim(${table.titleEn}), ''), nullif(trim(${table.titleVi}), '')) is not null`
    ),
  ]
);

export const lesson = pgTable(
  "Lesson",
  {
    id: text("id").primaryKey(),
    titleEn: text("titleEn"),
    titleVi: text("titleVi"),
    descriptionEn: text("descriptionEn"),
    descriptionVi: text("descriptionVi"),
    thumbnailKey: text("thumbnailKey"),
    videoKey: text("videoKey"),
    position: integer("position").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    chapterId: text("chapterId")
      .notNull()
      .references(() => chapter.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "Lesson_title_required",
      sql`coalesce(nullif(trim(${table.titleEn}), ''), nullif(trim(${table.titleVi}), '')) is not null`
    ),
  ]
);

export const enrollment = pgTable(
  "Enrollment",
  {
    id: text("id").primaryKey(),
    amount: integer("amount").notNull(),
    status: enrollmentStatusEnum("status").default("Pending").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    courseId: text("courseId")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      userCourseUnique: uniqueIndex("Enrollment_userId_courseId_key").on(table.userId, table.courseId),
    };
  }
);

export const lessonProgress = pgTable(
  "LessonProgess",
  {
    id: text("id").primaryKey(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lessonId")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      userLessonUnique: uniqueIndex("LessonProgess_userId_lessonId_key").on(table.userId, table.lessonId),
    };
  }
);

// --- DRIZZLE RELATIONS ---
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  courses: many(course),
  enrollments: many(enrollment),
  lessonProgresses: many(lessonProgress),
  profile: one(userProfile, { fields: [user.id], references: [userProfile.userId] }),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  user: one(user, { fields: [course.userId], references: [user.id] }),
  chapter: many(chapter),
  enrollment: many(enrollment),
}));

export const chapterRelations = relations(chapter, ({ one, many }) => ({
  Course: one(course, { fields: [chapter.courseId], references: [course.id] }),
  lessons: many(lesson),
}));

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  Chapter: one(chapter, {
    fields: [lesson.chapterId],
    references: [chapter.id],
  }),
  lessonProgess: many(lessonProgress),
}));

export const enrollmentRelations = relations(enrollment, ({ one }) => ({
  Course: one(course, {
    fields: [enrollment.courseId],
    references: [course.id],
  }),
  User: one(user, { fields: [enrollment.userId], references: [user.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  User: one(user, { fields: [lessonProgress.userId], references: [user.id] }),
  Lesson: one(lesson, {
    fields: [lessonProgress.lessonId],
    references: [lesson.id],
  }),
}));
