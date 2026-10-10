import { afterAll, describe, expect, it } from "@jest/globals";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../../../backend/src/db/schema.js";
import { openIntegrationDatabase } from "../../../backend/tests/support/integrationDatabase.js";
import { cleanupRun, readRun, recordResource, setupRun } from "../../tooling/fixtures/fixtures.js";
import { readRunManifest, writeRunManifest } from "../../tooling/fixtures/runStore.js";
import type { RunRef } from "../../tooling/fixtures/types.js";

const runA: RunRef = { runId: "323e4567-e89b-42d3-a456-426614174000", suite: "profile" };
const runB: RunRef = { runId: "423e4567-e89b-42d3-a456-426614174000", suite: "profile" };
const runStorage: RunRef = { runId: "623e4567-e89b-42d3-a456-426614174000", suite: "storage" };
const runPaymentCleanup: RunRef = { runId: "723e4567-e89b-42d3-a456-426614174000", suite: "payment" };
const unrelatedUserId = "bruno-unrelated-user-for-fixture-test";
const unrelatedCourseId = "bruno-unrelated-course-for-fixture-test";
const unrelatedSlug = "bruno-unrelated-course-for-fixture-test";

describe("run-scoped Bruno fixtures", () => {
  afterAll(async () => {
    const integration = await openIntegrationDatabase();
    try {
      await cleanupRun(runA).catch(() => undefined);
      await cleanupRun(runB).catch(() => undefined);
      await cleanupRun(runStorage).catch(() => undefined);
      await cleanupRun(
        runPaymentCleanup,
        undefined,
        async () => "retained",
        async () => []
      ).catch(() => undefined);
      await integration.db.delete(schema.course).where(eq(schema.course.id, unrelatedCourseId));
      await integration.db.delete(schema.user).where(eq(schema.user.id, unrelatedUserId));
    } finally {
      await integration.close();
    }
  });

  it("creates independent fixtures and retries setup without duplicates", async () => {
    const integration = await openIntegrationDatabase();
    try {
      const first = await setupRun(runA);
      const second = await setupRun(runB);
      const retry = await setupRun(runA);

      expect(first.actors.learnerA.id).not.toBe(second.actors.learnerA.id);
      expect(retry.actors.learnerA.id).toBe(first.actors.learnerA.id);
      expect(retry.actors.learnerA.password).toBe(process.env.BRUNO_TEST_PASSWORD || "BrunoPass123!");
      expect(retry.ids.publishedSlug).toContain(runA.runId.replaceAll("-", ""));

      const matchingUsers = await integration.db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(inArray(schema.user.id, [first.actors.admin.id, first.actors.learnerA.id, first.actors.learnerB.id]));
      expect(matchingUsers).toHaveLength(3);
    } finally {
      await integration.close();
    }
  });

  it("cleans one run without touching another run or an unrelated bruno slug", async () => {
    const integration = await openIntegrationDatabase();
    try {
      const second = await readRun(runB);
      await integration.db
        .insert(schema.user)
        .values({
          id: unrelatedUserId,
          name: "Unrelated Bruno User",
          email: "unrelated-bruno-fixture@example.com",
          emailVerified: true,
          role: "user",
        })
        .onConflictDoNothing();
      await integration.db
        .insert(schema.course)
        .values({
          id: unrelatedCourseId,
          title: "Unrelated Bruno Course",
          description: "belongs to an unrelated test",
          fileKey: "unrelated.png",
          price: 0,
          duration: 1,
          level: "Beginner",
          stripePriceId: "unrelated-bruno-fixture-price",
          category: "Testing",
          smallDescription: "unrelated fixture",
          slug: unrelatedSlug,
          status: "Published",
          userId: unrelatedUserId,
        })
        .onConflictDoNothing();
      await integration.db
        .insert(schema.session)
        .values({
          id: "bruno-run-b-survival-session",
          token: "bruno-run-b-survival-token",
          expiresAt: new Date(Date.now() + 60_000),
          userId: second.actors.learnerA.id,
        })
        .onConflictDoNothing();

      await cleanupRun(runA);

      const runBUser = await integration.db.query.user.findFirst({
        where: eq(schema.user.id, second.actors.learnerA.id),
      });
      const runBSession = await integration.db.query.session.findFirst({
        where: eq(schema.session.id, "bruno-run-b-survival-session"),
      });
      const runBCourse = await integration.db.query.course.findFirst({
        where: eq(schema.course.id, second.ids.publishedCourse),
      });
      const unrelatedCourse = await integration.db.query.course.findFirst({
        where: eq(schema.course.slug, unrelatedSlug),
      });
      expect(runBUser).toBeDefined();
      expect(runBSession).toBeDefined();
      expect(runBCourse).toBeDefined();
      expect(unrelatedCourse?.id).toBe(unrelatedCourseId);
    } finally {
      await integration.close();
    }
  });

  it("makes cleanup repeatable and rejects reads of cleaned or missing runs", async () => {
    const integration = await openIntegrationDatabase();
    try {
      expect(await cleanupRun(runA)).toEqual({ remaining: [], retained: [] });
      expect(await cleanupRun(runA)).toEqual({ remaining: [], retained: [] });
      await expect(readRun(runA)).rejects.toThrow("active run was not found");
      await expect(readRun({ runId: "523e4567-e89b-42d3-a456-426614174000", suite: "profile" })).rejects.toThrow(
        "active run was not found"
      );
      await expect(cleanupRun({ runId: "523e4567-e89b-42d3-a456-426614174000", suite: "profile" })).rejects.toThrow(
        "run manifest was not found"
      );
    } finally {
      await integration.close();
    }
  });

  it("rejects recording a database resource owned by another run", async () => {
    const second = await setupRun(runB);

    await expect(recordResource(runA, { kind: "database", id: second.ids.publishedCourse })).rejects.toThrow(
      "database resource is not owned by this run"
    );
  });

  it("retains failed storage cleanup for recovery and clears it on a later cleanup", async () => {
    await setupRun(runStorage);
    const key = `uploads/123-${runStorage.runId}-recover.txt`;
    await recordResource(runStorage, { kind: "storage", key });
    let attempts = 0;
    const removeStorageObject = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary provider outage");
    };

    await expect(cleanupRun(runStorage, removeStorageObject)).resolves.toEqual({ remaining: [key], retained: [] });
    expect(await readRunManifest(runStorage)).toMatchObject({
      status: "cleaning",
      resources: [{ kind: "storage", key }],
    });
    await expect(cleanupRun(runStorage, removeStorageObject)).resolves.toEqual({ remaining: [], retained: [] });
    expect(attempts).toBe(2);
    await expect(cleanupRun(runStorage, removeStorageObject)).resolves.toEqual({ remaining: [], retained: [] });
    expect(attempts).toBe(3);
  });

  it("reports retained provider history separately from cleanup failures", async () => {
    await setupRun(runPaymentCleanup);
    await recordResource(runPaymentCleanup, { kind: "stripe-session", id: "cs_test_retained_history" });
    const removePaymentResource = async () => "retained" as const;

    await expect(cleanupRun(runPaymentCleanup, undefined, removePaymentResource, async () => [])).resolves.toEqual({
      remaining: [],
      retained: ["cs_test_retained_history"],
    });
    expect(await readRunManifest(runPaymentCleanup)).toMatchObject({
      status: "cleaned",
      resources: [],
      retained: [{ kind: "stripe-session", id: "cs_test_retained_history" }],
    });
    await expect(cleanupRun(runPaymentCleanup, undefined, removePaymentResource, async () => [])).resolves.toEqual({
      remaining: [],
      retained: ["cs_test_retained_history"],
    });
  });
});

it("setup retry preserves tracked resources and business rows", async () => {
  const ref: RunRef = { runId: "823e4567-e89b-42d3-a456-426614174000", suite: "storage" };
  await setupRun(ref);
  const key = `uploads/123-${ref.runId}-retry.txt`;
  await recordResource(ref, { kind: "storage", key });
  await setupRun(ref);
  expect((await readRunManifest(ref))?.resources).toContainEqual({ kind: "storage", key });
  await cleanupRun(ref, async () => undefined);
});

it("recovers a registered auth user even before the separate registration helper runs", async () => {
  const ref: RunRef = { runId: "923e4567-e89b-42d3-a456-426614174000", suite: "auth" };
  const fixtures = await setupRun(ref);
  const integration = await openIntegrationDatabase();
  const userId = "bruno-interrupted-auth-random-id";
  try {
    await integration.db.insert(schema.user).values({
      id: userId,
      name: "Interrupted Signup",
      email: fixtures.actors.learnerA.email,
      emailVerified: false,
      role: "user",
    });
    await cleanupRun(ref);
    expect(await integration.db.query.user.findFirst({ where: eq(schema.user.id, userId) })).toBeUndefined();
  } finally {
    await integration.db.delete(schema.user).where(eq(schema.user.id, userId));
    await integration.close();
  }
});

it("discovers untracked payment resources before deleting the owned user", async () => {
  const ref: RunRef = { runId: "a23e4567-e89b-42d3-a456-426614174000", suite: "payment" };
  const fixtures = await setupRun(ref);
  const integration = await openIntegrationDatabase();
  try {
    const discovery = async () => {
      expect(
        await integration.db.query.user.findFirst({ where: eq(schema.user.id, fixtures.actors.learnerA.id) })
      ).toBeDefined();
      return [{ kind: "stripe-session" as const, id: "cs_test_interrupted_checkout" }];
    };
    expect(await cleanupRun(ref, undefined, async () => "retained", discovery)).toEqual({
      remaining: [],
      retained: ["cs_test_interrupted_checkout"],
    });
  } finally {
    await integration.close();
  }
});

it("keeps a recoverable preparing manifest when finalization fails after DB commit", async () => {
  const ref: RunRef = { runId: "b23e4567-e89b-42d3-a456-426614174000", suite: "profile" };
  await expect(
    setupRun(ref, async (value, manifest) => {
      if (manifest.status === "active") throw new Error("simulated finalization outage");
      await writeRunManifest(value, manifest);
    })
  ).rejects.toThrow("finalization outage");
  expect((await readRunManifest(ref))?.status).toBe("preparing");
  await cleanupRun(ref);
  const integration = await openIntegrationDatabase();
  try {
    expect(
      await integration.db.query.user.findFirst({
        where: eq(schema.user.id, `bruno-profile-${ref.runId.replaceAll("-", "")}-learner-a`),
      })
    ).toBeUndefined();
  } finally {
    await integration.close();
  }
});

it("does not insert DB fixtures when initial ownership persistence fails", async () => {
  const ref: RunRef = { runId: "c23e4567-e89b-42d3-a456-426614174000", suite: "profile" };
  await expect(
    setupRun(ref, async () => {
      throw new Error("initial manifest outage");
    })
  ).rejects.toThrow("initial manifest outage");
  const integration = await openIntegrationDatabase();
  try {
    expect(
      await integration.db.query.user.findFirst({
        where: eq(schema.user.id, `bruno-profile-${ref.runId.replaceAll("-", "")}-learner-a`),
      })
    ).toBeUndefined();
  } finally {
    await integration.close();
  }
});

it("reconciles a late auth signup after an earlier cleanup reported cleaned", async () => {
  const ref: RunRef = { runId: "e23e4567-e89b-42d3-a456-426614174000", suite: "auth" };
  const fixture = await setupRun(ref);
  await cleanupRun(ref);
  const integration = await openIntegrationDatabase();
  const id = "bruno-late-auth-request";
  try {
    await integration.db.insert(schema.user).values({ id, name: "Late Signup", email: fixture.actors.learnerA.email });
    await cleanupRun(ref);
    expect(await integration.db.query.user.findFirst({ where: eq(schema.user.id, id) })).toBeUndefined();
  } finally {
    await integration.db.delete(schema.user).where(eq(schema.user.id, id));
    await integration.close();
  }
});

it("reconciles a late payment resource even after cleanup reported cleaned", async () => {
  const ref: RunRef = { runId: "f23e4567-e89b-42d3-a456-426614174000", suite: "payment" };
  await setupRun(ref);
  let completed = false;
  const discovery = async () => (completed ? [{ kind: "stripe-session" as const, id: "cs_test_late_checkout" }] : []);
  await cleanupRun(ref, undefined, async () => "retained", discovery);
  completed = true;
  expect(await cleanupRun(ref, undefined, async () => "retained", discovery)).toEqual({
    remaining: [],
    retained: ["cs_test_late_checkout"],
  });
});

it("reconciles a late presigned upload after storage cleanup succeeded", async () => {
  const ref: RunRef = { runId: "123e4567-e89b-42d3-a456-426614174001", suite: "storage" };
  await setupRun(ref);
  const key = `uploads/123-${ref.runId}-late.txt`;
  await recordResource(ref, { kind: "storage", key });
  let exists = true;
  const remove = async () => {
    exists = false;
  };
  await cleanupRun(ref, remove);
  exists = true; // The backend/presigned PUT completes after the first cleanup.
  await cleanupRun(ref, remove);
  expect(exists).toBe(false);
});
