import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { eq, sql } from "drizzle-orm";
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

async function chapterPositions() {
  const integration = await openIntegrationDatabase();
  try {
    return await integration.db
      .select({ id: schema.chapter.id, position: schema.chapter.position })
      .from(schema.chapter)
      .where(eq(schema.chapter.courseId, fixtures.ids.publishedCourse));
  } finally {
    await integration.close();
  }
}

async function lessonPositions() {
  const integration = await openIntegrationDatabase();
  try {
    return await integration.db
      .select({ id: schema.lesson.id, position: schema.lesson.position })
      .from(schema.lesson)
      .where(eq(schema.lesson.chapterId, fixtures.ids.chapterA));
  } finally {
    await integration.close();
  }
}

async function reorder(path: string, items: Array<{ id: string; position: number }>) {
  return app.inject({
    method: "POST",
    url: `/api/v1/admin/${path}/reorder`,
    headers: { cookie: adminCookie, "content-type": "application/json" },
    payload: { items },
  });
}

describe("atomic course ordering", () => {
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

  it("swaps chapter siblings and rejects invalid batches without changing positions", async () => {
    const valid = await reorder("chapters", [
      { id: fixtures.ids.chapterA, position: 2 },
      { id: fixtures.ids.chapterB, position: 1 },
    ]);
    expect(valid.statusCode).toBe(200);
    const before = await chapterPositions();

    const invalidBatches = [
      { items: [], status: 400 },
      {
        items: [
          { id: fixtures.ids.chapterA, position: 1 },
          { id: fixtures.ids.chapterA, position: 2 },
        ],
        status: 400,
      },
      {
        items: [
          { id: fixtures.ids.chapterA, position: 1 },
          { id: fixtures.ids.activeChapter, position: 2 },
        ],
        status: 400,
      },
      { items: [{ id: fixtures.ids.chapterA, position: 0 }], status: 400 },
      { items: [{ id: fixtures.ids.chapterA, position: -1 }], status: 400 },
      { items: [{ id: fixtures.ids.chapterA, position: 1.5 }], status: 400 },
      { items: [{ id: "missing-admin-chapter", position: 1 }], status: 404 },
      { items: [{ id: fixtures.ids.chapterA, position: 1 }], status: 400 },
    ];
    for (const { items, status } of invalidBatches) {
      const response = await reorder("chapters", items);
      expect({ actual: response.statusCode, items }).toEqual({ actual: status, items });
      expect(await chapterPositions()).toEqual(before);
    }
  });

  it("reorders sibling lessons", async () => {
    const siblingId = `${fixtures.ids.lessonA}-sibling`;
    const integration = await openIntegrationDatabase();
    try {
      await integration.db.insert(schema.lesson).values({
        id: siblingId,
        title: "Lesson A sibling",
        position: 2,
        chapterId: fixtures.ids.chapterA,
      });
    } finally {
      await integration.close();
    }
    const response = await reorder("lessons", [
      { id: fixtures.ids.lessonA, position: 2 },
      { id: siblingId, position: 1 },
    ]);
    expect(response.statusCode).toBe(200);
    const ordered = await lessonPositions();
    expect(ordered.find((item) => item.id === fixtures.ids.lessonA)?.position).toBe(2);
    expect(ordered.find((item) => item.id === siblingId)?.position).toBe(1);

    const before = await lessonPositions();
    const invalidBatches = [
      { items: [], status: 400 },
      {
        items: [
          { id: fixtures.ids.lessonA, position: 1 },
          { id: fixtures.ids.lessonA, position: 2 },
        ],
        status: 400,
      },
      {
        items: [
          { id: fixtures.ids.lessonA, position: 1 },
          { id: fixtures.ids.pendingLesson, position: 2 },
        ],
        status: 400,
      },
      { items: [{ id: fixtures.ids.lessonA, position: 0 }], status: 400 },
      { items: [{ id: fixtures.ids.lessonA, position: -1 }], status: 400 },
      { items: [{ id: fixtures.ids.lessonA, position: 1.5 }], status: 400 },
      { items: [{ id: "missing-admin-lesson", position: 1 }], status: 404 },
      { items: [{ id: fixtures.ids.lessonA, position: 1 }], status: 400 },
    ];
    for (const { items, status } of invalidBatches) {
      const rejected = await reorder("lessons", items);
      expect({ actual: rejected.statusCode, items }).toEqual({ actual: status, items });
      expect(await lessonPositions()).toEqual(before);
    }
  });

  it("rolls back every write when a later update fails", async () => {
    const integration = await openIntegrationDatabase();
    try {
      await integration.db.execute(
        sql.raw(`
        CREATE OR REPLACE FUNCTION bruno_reorder_failure() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.id = '${fixtures.ids.chapterB}' AND NEW.position = 2 THEN
            RAISE EXCEPTION 'forced Bruno reorder failure';
          END IF;
          RETURN NEW;
        END;
        $$
      `)
      );
      await integration.db.execute(
        sql.raw(
          `CREATE TRIGGER bruno_reorder_failure_trigger BEFORE UPDATE ON "Chapter" FOR EACH ROW EXECUTE FUNCTION bruno_reorder_failure()`
        )
      );
    } finally {
      await integration.close();
    }
    const before = await chapterPositions();
    try {
      const response = await reorder("chapters", [
        { id: fixtures.ids.chapterA, position: 1 },
        { id: fixtures.ids.chapterB, position: 2 },
      ]);
      expect(response.statusCode).toBeGreaterThanOrEqual(500);
      expect(await chapterPositions()).toEqual(before);
    } finally {
      const cleanup = await openIntegrationDatabase();
      try {
        await cleanup.db.execute(sql.raw('DROP TRIGGER IF EXISTS bruno_reorder_failure_trigger ON "Chapter"'));
        await cleanup.db.execute(sql.raw("DROP FUNCTION IF EXISTS bruno_reorder_failure()"));
      } finally {
        await cleanup.close();
      }
    }
  });
});
