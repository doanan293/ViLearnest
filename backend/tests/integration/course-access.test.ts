import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { build } from "../../src/app.js";
import { client } from "../../src/db/index.js";
import * as schema from "../../src/db/schema.js";
import { openIntegrationDatabase } from "../support/integrationDatabase.js";
import { cleanupProductFixtures, type ProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

const scope = randomUUID();
let app: FastifyInstance;
let fixtures: ProductFixtures;
let learnerACookie: string;
let learnerBCookie: string;

async function login(email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    payload: { email, password },
  });
  expect(response.statusCode).toBe(200);
  const raw = response.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : [raw];
  const session = cookies.find((cookie) => cookie && /(?:__Secure-)?better-auth\.session_token=/.test(cookie));
  if (!session) throw new Error("Better Auth session cookie was not returned");
  return session.split(";")[0];
}

async function progressRows(userId: string, lessonId: string) {
  const integration = await openIntegrationDatabase();
  try {
    const [result] = await integration.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.lessonProgress)
      .where(and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.lessonId, lessonId)));
    return result?.count ?? 0;
  } finally {
    await integration.close();
  }
}

describe("public course visibility and learner access", () => {
  beforeAll(async () => {
    fixtures = await setupProductFixtures(scope);
    app = await build();
    await app.ready();
    learnerACookie = await login(fixtures.actors.learnerA.email, fixtures.actors.learnerA.password);
    learnerBCookie = await login(fixtures.actors.learnerB.email, fixtures.actors.learnerB.password);
  });

  afterAll(async () => {
    await app.close();
    try {
      if (fixtures) await cleanupProductFixtures(fixtures);
    } finally {
      await client.end();
    }
  });

  it("hides draft and archived courses from public detail", async () => {
    const draft = await app.inject({ method: "GET", url: `/api/v1/courses/by-slug/${fixtures.ids.draftSlug}` });
    const archived = await app.inject({ method: "GET", url: `/api/v1/courses/by-slug/${fixtures.ids.archivedSlug}` });

    expect(draft.statusCode).toBe(404);
    expect(archived.statusCode).toBe(404);
  });

  it("returns public curriculum titles and positions without protected lesson content", async () => {
    const response = await app.inject({ method: "GET", url: `/api/v1/courses/by-slug/${fixtures.ids.publishedSlug}` });
    const course = response.json();
    const lesson = course.chapter[0].lessons[0];

    expect(response.statusCode).toBe(200);
    expect(lesson).toMatchObject({ id: fixtures.ids.lessonA, title: "Lesson A", position: 1 });
    expect(lesson).not.toHaveProperty("description");
    expect(lesson).not.toHaveProperty("videoKey");
    expect(lesson).not.toHaveProperty("thumbnailKey");
    expect(lesson).not.toHaveProperty("lessonProgess");
  });

  it("requires active enrollment before completion and leaves denied writes absent", async () => {
    const complete = (cookie: string, lessonId: string) =>
      app.inject({
        method: "POST",
        url: "/api/v1/courses/lesson/complete",
        headers: { cookie, "content-type": "application/json" },
        payload: { lessonId },
      });

    expect((await complete(learnerACookie, fixtures.ids.activeLesson)).statusCode).toBe(200);
    expect((await complete(learnerACookie, fixtures.ids.activeLesson)).statusCode).toBe(200);
    expect(await progressRows(fixtures.actors.learnerA.id, fixtures.ids.activeLesson)).toBe(1);

    expect((await complete(learnerACookie, fixtures.ids.pendingLesson)).statusCode).toBe(403);
    expect(await progressRows(fixtures.actors.learnerA.id, fixtures.ids.pendingLesson)).toBe(0);
    expect((await complete(learnerACookie, fixtures.ids.unenrolledLesson)).statusCode).toBe(403);
    expect(await progressRows(fixtures.actors.learnerA.id, fixtures.ids.unenrolledLesson)).toBe(0);
    expect((await complete(learnerACookie, "missing-bruno-lesson")).statusCode).toBe(404);
    expect(await progressRows(fixtures.actors.learnerA.id, "missing-bruno-lesson")).toBe(0);
  });

  it("keeps learner progress isolated", async () => {
    const learnerA = await app.inject({
      method: "GET",
      url: `/api/v1/courses/by-slug/${fixtures.ids.activeSlug}/sidebar`,
      headers: { cookie: learnerACookie },
    });
    const learnerB = await app.inject({
      method: "GET",
      url: `/api/v1/courses/by-slug/${fixtures.ids.activeSlug}/sidebar`,
      headers: { cookie: learnerBCookie },
    });
    const activeLessonA = learnerA
      .json()
      .course.chapter.flatMap((chapter: { lessons: unknown[] }) => chapter.lessons)
      .find((lesson: { id: string }) => lesson.id === fixtures.ids.activeLesson);
    const activeLessonB = learnerB
      .json()
      .course.chapter.flatMap((chapter: { lessons: unknown[] }) => chapter.lessons)
      .find((lesson: { id: string }) => lesson.id === fixtures.ids.activeLesson);

    expect(learnerA.statusCode).toBe(200);
    expect(learnerB.statusCode).toBe(200);
    expect(activeLessonA.lessonProgess).toHaveLength(1);
    expect(activeLessonA.lessonProgess[0].completed).toBe(true);
    expect(activeLessonB.lessonProgess).toHaveLength(0);
  });

  it("preserves protected access for existing active learners after archival", async () => {
    const integration = await openIntegrationDatabase();
    try {
      await integration.db
        .update(schema.course)
        .set({ status: "Archived" })
        .where(eq(schema.course.id, fixtures.ids.activeCourse));
    } finally {
      await integration.close();
    }

    const protectedResponse = await app.inject({
      method: "GET",
      url: `/api/v1/courses/by-slug/${fixtures.ids.activeSlug}/sidebar`,
      headers: { cookie: learnerACookie },
    });
    const publicResponse = await app.inject({
      method: "GET",
      url: `/api/v1/courses/by-slug/${fixtures.ids.activeSlug}`,
    });

    expect(protectedResponse.statusCode).toBe(200);
    expect(publicResponse.statusCode).toBe(404);
  });
});
