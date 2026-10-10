import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, like } from "drizzle-orm";
import * as schema from "../../../backend/src/db/schema.js";
import { openIntegrationDatabase } from "../../../backend/tests/support/integrationDatabase.js";
import { buildLmsRows } from "../../../backend/tests/support/lmsRows.js";
import { getBrunoPassword } from "./content.js";
import { readRunManifest, updateRunManifest, withRunLock, writeRunManifest } from "./runStore.js";
import { assertOwnedStorageKey, deleteOwnedObject } from "./storageProbe.js";
import type { Actor, ActorFixture, OwnedResource, RunFixtures, RunManifest, RunRef } from "./types.js";

const actorOrder: Actor[] = ["admin", "learnerA", "learnerB"];
type Database = typeof import("../../../backend/src/db/index.js").db;

async function withDatabase<T>(operation: (database: Database) => Promise<T>): Promise<T> {
  if (process.env.TEST_DATABASE_URL) {
    const integration = await openIntegrationDatabase();
    try {
      return await operation(integration.db as Database);
    } finally {
      await integration.close();
    }
  }
  const { db } = await import("../../../backend/src/db/index.js");
  return operation(db);
}

function makeIds(ref: RunRef) {
  const prefix = `bruno-${ref.suite}-${ref.runId.replaceAll("-", "")}`;
  const slug = (name: string) => `${prefix}-${name}`;
  return {
    admin: `${prefix}-admin`,
    learnerA: `${prefix}-learner-a`,
    learnerB: `${prefix}-learner-b`,
    publishedCourse: `${prefix}-published-course`,
    publishedSlug: slug("published-course"),
    draftCourse: `${prefix}-draft-course`,
    draftSlug: slug("draft-course"),
    archivedCourse: `${prefix}-archived-course`,
    archivedSlug: slug("archived-course"),
    activeCourse: `${prefix}-active-course`,
    activeSlug: slug("active-course"),
    activeChapter: `${prefix}-active-chapter`,
    activeLesson: `${prefix}-active-lesson`,
    pendingCourse: `${prefix}-pending-course`,
    pendingSlug: slug("pending-course"),
    pendingChapter: `${prefix}-pending-chapter`,
    pendingLesson: `${prefix}-pending-lesson`,
    unenrolledCourse: `${prefix}-unenrolled-course`,
    unenrolledSlug: slug("unenrolled-course"),
    unenrolledChapter: `${prefix}-unenrolled-chapter`,
    unenrolledLesson: `${prefix}-unenrolled-lesson`,
    chapterA: `${prefix}-chapter-a`,
    chapterB: `${prefix}-chapter-b`,
    lessonA: `${prefix}-lesson-a`,
    lessonB: `${prefix}-lesson-b`,
  };
}

function makeActor(ref: RunRef, actor: Actor, id: string, password: string): ActorFixture {
  const suffix = actor === "learnerA" ? "learner-a" : actor === "learnerB" ? "learner-b" : "admin";
  const scope = ref.runId.replaceAll("-", "");
  return { id, email: `bruno-${ref.suite}-${scope}-${suffix}@example.com`, password };
}

function makeManifest(fixtures: RunFixtures): RunManifest {
  const actors = Object.fromEntries(
    actorOrder.map((actor) => {
      const { password: _password, ...publicActor } = fixtures.actors[actor];
      return [actor, publicActor];
    })
  ) as RunManifest["actors"];
  const userResources: OwnedResource[] = actorOrder
    .filter((actor) => fixtures.ref.suite !== "auth" || actor !== "learnerA")
    .map((actor) => ({ kind: "database", id: fixtures.actors[actor].id }));
  const courseResources: OwnedResource[] = Object.entries(fixtures.ids)
    .filter(([name]) => name.endsWith("Course"))
    .map(([, id]) => ({ kind: "database", id }));
  return {
    version: 1,
    status: "active",
    ref: fixtures.ref,
    actors,
    ids: fixtures.ids,
    resources: [...userResources, ...courseResources],
    retained: [],
    ownedStorageKeys: [],
  };
}

function hydrateFixtures(manifest: RunManifest): RunFixtures {
  const password = getBrunoPassword();
  return {
    ref: manifest.ref,
    actors: Object.fromEntries(actorOrder.map((actor) => [actor, { ...manifest.actors[actor], password }])) as Record<
      Actor,
      ActorFixture
    >,
    ids: manifest.ids,
  };
}

export async function setupRun(ref: RunRef, persistManifest = writeRunManifest): Promise<RunFixtures> {
  return withRunLock(ref, async () => {
    const previous = await readRunManifest(ref);
    if (previous?.status === "active") return hydrateFixtures(previous);
    if (previous?.status === "cleaning") throw new Error("cleanup must finish before setup retry");
    const password = getBrunoPassword();
    const passwordHash = await hashPassword(password);
    const ids = makeIds(ref);
    const actors = Object.fromEntries(
      actorOrder.map((actor) => [actor, makeActor(ref, actor, ids[actor], password)])
    ) as Record<Actor, ActorFixture>;
    const fixtures: RunFixtures = { ref, actors, ids };
    const rows = buildLmsRows({
      actors,
      ids,
      passwordHash,
      now: new Date(),
      assetPrefix: `bruno-fixtures/${ref.runId}`,
      omitLearnerA: ref.suite === "auth",
      includeArchivedEnrollments: ref.suite === "learning-access",
    });
    const courseIds = rows.courses.map((course) => course.id);
    const userIds = [...new Set([...rows.users.map((user) => user.id), ids.learnerA])];

    await persistManifest(ref, { ...makeManifest(fixtures), status: "preparing" });
    await withDatabase((database) =>
      database.transaction(async (tx) => {
        await tx.delete(schema.course).where(inArray(schema.course.id, courseIds));
        await tx.delete(schema.user).where(inArray(schema.user.id, userIds));
        await tx.insert(schema.user).values(rows.users);
        await tx.insert(schema.account).values(rows.accounts);
        await tx.insert(schema.userProfile).values(rows.userProfiles);
        await tx.insert(schema.course).values(rows.courses);
        await tx.insert(schema.chapter).values(rows.chapters);
        await tx.insert(schema.lesson).values(rows.lessons);
        if (rows.enrollments.length) await tx.insert(schema.enrollment).values(rows.enrollments);
        if (rows.lessonProgress.length) await tx.insert(schema.lessonProgress).values(rows.lessonProgress);
        if (ref.suite === "auth") {
          await tx.delete(schema.verification).where(like(schema.verification.identifier, `%${actors.learnerA.email}`));
        }
      })
    );

    await persistManifest(ref, makeManifest(fixtures));
    return fixtures;
  });
}

export async function readRun(ref: RunRef): Promise<RunFixtures> {
  const manifest = await readRunManifest(ref);
  if (manifest?.status !== "active") throw new Error("active run was not found");
  return hydrateFixtures(manifest);
}

export async function recordRegisteredActor(ref: RunRef, actor: Actor, userId: string) {
  return withRunLock(ref, async () => {
    const manifest = await readRunManifest(ref);
    if (manifest?.status !== "active") throw new Error("active run was not found");
    if (ref.suite !== "auth" || actor !== "learnerA") {
      throw new Error("only the reserved auth learnerA account can be registered");
    }

    const reserved = manifest.actors[actor];
    const user = await withDatabase((database) =>
      database.query.user.findFirst({ where: and(eq(schema.user.id, userId), eq(schema.user.email, reserved.email)) })
    );
    if (!user || user.email !== reserved.email) {
      throw new Error("registered account does not belong to this run actor");
    }
    if (reserved.id !== makeIds(ref).learnerA && reserved.id !== userId) {
      throw new Error("auth learnerA is already bound to another account");
    }

    const next = {
      ...manifest,
      actors: { ...manifest.actors, [actor]: { ...reserved, id: userId } },
      resources: manifest.resources.some((resource) => resource.kind === "database" && resource.id === userId)
        ? manifest.resources
        : [...manifest.resources, { kind: "database" as const, id: userId }],
    };
    await writeRunManifest(ref, next);
    return { id: user.id, email: user.email };
  });
}

export async function recordResource(ref: RunRef, resource: OwnedResource) {
  await updateRunManifest(ref, (manifest) => {
    if (resource.kind === "database") {
      const ownedIds = new Set(Object.values(manifest.ids));
      for (const actor of Object.values(manifest.actors)) ownedIds.add(actor.id);
      if (!ownedIds.has(resource.id)) throw new Error("database resource is not owned by this run");
    }
    if (resource.kind === "storage") assertOwnedStorageKey(ref, resource.key);
    const resources = manifest.resources.filter((entry) => JSON.stringify(entry) !== JSON.stringify(resource));
    return { ...manifest, resources: [...resources, resource] };
  });
}

export async function cleanupRun(
  ref: RunRef,
  removeStorageObject: typeof deleteOwnedObject = deleteOwnedObject,
  removePaymentResource: (
    ref: RunRef,
    resource: Extract<OwnedResource, { kind: "stripe-customer" | "stripe-session" }>
  ) => Promise<"deleted" | "retained"> = async (paymentRef, resource) => {
    const runtime = await import("../brunoPaymentRuntime.js");
    return runtime.cleanupRunPaymentResource(paymentRef, resource);
  },
  discoverPaymentResources: (ref: RunRef, manifest: RunManifest) => Promise<OwnedResource[]> = async (
    paymentRef,
    manifest
  ) => {
    const runtime = await import("../brunoPaymentRuntime.js");
    return runtime.discoverRunPaymentResources(paymentRef, manifest);
  }
): Promise<{ remaining: string[]; retained: string[] }> {
  return withRunLock(ref, async () => {
    let manifest = await readRunManifest(ref);
    if (!manifest) throw new Error("run manifest was not found");
    if (manifest.status === "cleaned" && !["auth", "payment", "storage"].includes(ref.suite)) {
      return {
        remaining: [],
        retained: (manifest.retained ?? []).map((resource) =>
          resource.kind === "storage" ? resource.key : resource.id
        ),
      };
    }

    if (ref.suite === "auth") {
      const expected = makeActor(ref, "learnerA", makeIds(ref).learnerA, "");
      if (manifest.actors.learnerA.email !== expected.email) throw new Error("reserved auth email is not run-owned");
      const user = await withDatabase((database) =>
        database.query.user.findFirst({ where: eq(schema.user.email, expected.email) })
      );
      if (user)
        manifest = { ...manifest, actors: { ...manifest.actors, learnerA: { id: user.id, email: user.email } } };
    }
    if (ref.suite === "payment") {
      const discovered = await discoverPaymentResources(ref, manifest);
      const resources = [...manifest.resources];
      for (const resource of discovered) {
        if (
          !resources.some((entry) => JSON.stringify(entry) === JSON.stringify(resource)) &&
          !(manifest.retained ?? []).some((entry) => JSON.stringify(entry) === JSON.stringify(resource))
        )
          resources.push(resource);
      }
      manifest = { ...manifest, resources };
    }
    if (ref.suite === "storage") {
      const ownedStorageKeys = [
        ...new Set([
          ...(manifest.ownedStorageKeys ?? []),
          ...manifest.resources.filter((resource) => resource.kind === "storage").map((resource) => resource.key),
        ]),
      ];
      const resources = [...manifest.resources];
      for (const key of ownedStorageKeys) {
        assertOwnedStorageKey(ref, key);
        if (!resources.some((entry) => entry.kind === "storage" && entry.key === key))
          resources.push({ kind: "storage", key });
      }
      manifest = { ...manifest, resources, ownedStorageKeys };
    }
    // Persist discoveries before deleting the only database linkage to created resources.
    manifest = { ...manifest, status: "cleaning" };
    await writeRunManifest(ref, manifest);
    const actorIds = Object.values(manifest.actors).map((actor) => actor.id);
    const courseIds = manifest.resources
      .filter(
        (resource): resource is Extract<OwnedResource, { kind: "database" }> =>
          resource.kind === "database" && Object.values(manifest.ids).includes(resource.id)
      )
      .map((resource) => resource.id);
    const providerResources = manifest.resources.filter((resource) => resource.kind !== "database");

    const cleanupActors = Object.values(manifest.actors);
    await withDatabase((database) =>
      database.transaction(async (tx) => {
        if (courseIds.length) await tx.delete(schema.course).where(inArray(schema.course.id, courseIds));
        if (actorIds.length) await tx.delete(schema.user).where(inArray(schema.user.id, actorIds));
        for (const actor of cleanupActors) {
          await tx.delete(schema.verification).where(like(schema.verification.identifier, `%${actor.email}`));
        }
      })
    );

    const cleanupOrder = [...providerResources].sort((left, right) => {
      const rank = (resource: OwnedResource) =>
        resource.kind === "stripe-session"
          ? 0
          : resource.kind === "storage"
            ? 1
            : resource.kind === "stripe-customer"
              ? 2
              : 3;
      return rank(left) - rank(right);
    });
    const remainingResources = [] as typeof providerResources;
    const retainedResources = [...(manifest.retained ?? [])];
    for (const resource of cleanupOrder) {
      try {
        if (resource.kind === "storage") {
          await removeStorageObject(ref, resource.key);
        } else if (resource.kind === "stripe-customer" || resource.kind === "stripe-session") {
          const outcome = await removePaymentResource(ref, resource);
          if (outcome === "retained") retainedResources.push(resource);
        }
      } catch {
        remainingResources.push(resource);
      }
    }
    const remaining = remainingResources.map((resource) => (resource.kind === "storage" ? resource.key : resource.id));
    await writeRunManifest(ref, {
      ...manifest,
      status: remaining.length ? "cleaning" : "cleaned",
      resources: remainingResources,
      retained: retainedResources,
    });
    return {
      remaining,
      retained: retainedResources.map((resource) => (resource.kind === "storage" ? resource.key : resource.id)),
    };
  });
}

export async function validateOwnedFixture(ref: RunRef, resourceId: string) {
  const manifest = await readRunManifest(ref);
  if (manifest?.status !== "active") throw new Error("active run was not found");
  if (
    !Object.values(manifest.ids).includes(resourceId) &&
    !Object.values(manifest.actors).some((actor) => actor.id === resourceId)
  ) {
    throw new Error("resource is not owned by this run");
  }
  return manifest;
}

export async function userHasRunFixture(ref: RunRef, actor: Actor) {
  const manifest = await readRunManifest(ref);
  if (manifest?.status !== "active") return false;
  return withDatabase(async (database) =>
    Boolean(
      await database.query.user.findFirst({
        where: and(eq(schema.user.id, manifest.actors[actor].id), eq(schema.user.email, manifest.actors[actor].email)),
      })
    )
  );
}
