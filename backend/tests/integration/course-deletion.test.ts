import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { build } from "../../src/build-app.js";
import { client } from "../../src/db/index.js";
import * as schema from "../../src/db/schema.js";
import { openIntegrationDatabase } from "../support/integrationDatabase.js";
import { cleanupProductFixtures, type ProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

const scope = randomUUID();
let app: FastifyInstance;
let fixtures: ProductFixtures;
let adminCookie: string;

describe("administration deletion cascades", () => {
  beforeAll(async () => {
    fixtures = await setupProductFixtures(scope);
    app = await build();
    await app.ready();
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      payload: { email: fixtures.actors.admin.email, password: fixtures.actors.admin.password },
    });
    const cookies = login.headers["set-cookie"];
    const list = Array.isArray(cookies) ? cookies : [cookies];
    adminCookie = list.find((item) => item && /(?:__Secure-)?better-auth\.session_token=/.test(item))!.split(";")[0];
  });

  afterAll(async () => {
    if (app) await app.close();
    try {
      if (fixtures) await cleanupProductFixtures(fixtures);
    } finally {
      await client.end();
    }
  });

  it("deleting a chapter removes its lessons and progress while preserving its course sibling", async () => {
    const integration = await openIntegrationDatabase();
    try {
      await integration.db.insert(schema.lessonProgress).values({
        id: `${fixtures.ids.lessonA}-deletion-progress`,
        userId: fixtures.actors.learnerA.id,
        lessonId: fixtures.ids.lessonA,
        completed: true,
      });
    } finally {
      await integration.close();
    }

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/chapters/${fixtures.ids.chapterA}`,
      headers: { cookie: adminCookie },
    });
    expect(deleted.statusCode).toBe(200);
    const remaining = await app.inject({
      method: "GET",
      url: `/api/v1/admin/courses/${fixtures.ids.publishedCourse}`,
      headers: { cookie: adminCookie },
    });
    expect(remaining.json().chapter.map((chapter: { id: string }) => chapter.id)).toContain(fixtures.ids.chapterB);

    const check = await openIntegrationDatabase();
    try {
      expect(
        await check.db.select().from(schema.lesson).where(eq(schema.lesson.id, fixtures.ids.lessonA))
      ).toHaveLength(0);
      expect(
        await check.db
          .select()
          .from(schema.lessonProgress)
          .where(eq(schema.lessonProgress.lessonId, fixtures.ids.lessonA))
      ).toHaveLength(0);
      expect(
        await check.db.select().from(schema.chapter).where(eq(schema.chapter.id, fixtures.ids.chapterB))
      ).toHaveLength(1);
    } finally {
      await check.close();
    }
  });

  it("deleting a course removes descendants, enrollment and progress while preserving another course", async () => {
    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/courses/${fixtures.ids.pendingCourse}`,
      headers: { cookie: adminCookie },
    });
    expect(deleted.statusCode).toBe(200);
    const check = await openIntegrationDatabase();
    try {
      expect(
        await check.db.select().from(schema.course).where(eq(schema.course.id, fixtures.ids.pendingCourse))
      ).toHaveLength(0);
      expect(
        await check.db.select().from(schema.chapter).where(eq(schema.chapter.id, fixtures.ids.pendingChapter))
      ).toHaveLength(0);
      expect(
        await check.db.select().from(schema.lesson).where(eq(schema.lesson.id, fixtures.ids.pendingLesson))
      ).toHaveLength(0);
      expect(
        await check.db
          .select()
          .from(schema.enrollment)
          .where(eq(schema.enrollment.courseId, fixtures.ids.pendingCourse))
      ).toHaveLength(0);
      expect(
        await check.db
          .select()
          .from(schema.lessonProgress)
          .where(eq(schema.lessonProgress.lessonId, fixtures.ids.pendingLesson))
      ).toHaveLength(0);
      expect(
        await check.db.select().from(schema.course).where(eq(schema.course.id, fixtures.ids.publishedCourse))
      ).toHaveLength(1);
    } finally {
      await check.close();
    }
  });
});
