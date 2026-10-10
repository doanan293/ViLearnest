import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { and, eq } from "drizzle-orm";
import { client, db } from "../../src/db/index.js";
import { CourseRepository } from "../../src/db/repository/courseRepository.js";
import * as schema from "../../src/db/schema.js";
import { cleanupProductFixtures, type ProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

const scope = randomUUID();
let fixtures: ProductFixtures;
let courses: CourseRepository;

describe("ownership-scoped payment activation", () => {
  beforeAll(async () => {
    fixtures = await setupProductFixtures(scope);
    courses = new CourseRepository(db);
  });

  afterAll(async () => {
    if (fixtures) await cleanupProductFixtures(fixtures);
    await client.end();
  });

  it("rejects mismatched owner, course, amount and missing enrollment without changing pending state", async () => {
    const enrollmentId = `${fixtures.ids.pendingCourse}-enrollment-a`;

    await expect(
      courses.activateEnrollment({
        enrollmentId,
        userId: fixtures.actors.learnerB.id,
        courseId: fixtures.ids.pendingCourse,
        amountMinor: 4900,
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      courses.activateEnrollment({
        enrollmentId,
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.activeCourse,
        amountMinor: 4900,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      courses.activateEnrollment({
        enrollmentId,
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        amountMinor: 4800,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      courses.activateEnrollment({
        enrollmentId: "missing-payment-enrollment",
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        amountMinor: 4900,
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    const unchanged = await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) });
    expect(unchanged).toMatchObject({
      userId: fixtures.actors.learnerA.id,
      courseId: fixtures.ids.pendingCourse,
      amount: 49,
      status: "Pending",
    });
  });

  it("serializes concurrent activation and preserves owner, course and minor-unit amount on replay", async () => {
    const enrollmentId = `${fixtures.ids.pendingCourse}-enrollment-a`;
    const input = {
      enrollmentId,
      userId: fixtures.actors.learnerA.id,
      courseId: fixtures.ids.pendingCourse,
      amountMinor: 4900,
    };
    const outcomes = await Promise.all([courses.activateEnrollment(input), courses.activateEnrollment(input)]);

    expect(outcomes.sort()).toEqual(["activated", "already-active"]);
    const enrollment = await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) });
    expect(enrollment).toMatchObject({
      userId: fixtures.actors.learnerA.id,
      courseId: fixtures.ids.pendingCourse,
      amount: 4900,
      status: "Active",
    });

    const rows = await db.query.enrollment.findMany({
      where: and(
        eq(schema.enrollment.userId, fixtures.actors.learnerA.id),
        eq(schema.enrollment.courseId, fixtures.ids.pendingCourse)
      ),
    });
    expect(rows).toHaveLength(1);
  });
});
