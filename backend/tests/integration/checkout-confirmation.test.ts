import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";
import { build } from "../../src/build-app.js";
import { config } from "../../src/config/index.js";
import { client, db } from "../../src/db/index.js";
import * as schema from "../../src/db/schema.js";
import { checkoutCompletedPayload, signWebhook } from "../support/paymentEvents.js";
import { cleanupProductFixtures, type ProductFixtures, setupProductFixtures } from "../support/productFixtures.js";

const scope = randomUUID();
let app: FastifyInstance;
let fixtures: ProductFixtures;
let learnerACookie: string;
let learnerBCookie: string;
let checkoutSession: Partial<Stripe.Checkout.Session>;

async function login(email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    payload: { email, password },
  });
  expect(response.statusCode).toBe(200);
  const rawCookies = response.headers["set-cookie"];
  const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
  return cookies.find((cookie) => cookie && /(?:__Secure-)?better-auth\.session_token=/.test(cookie))!.split(";")[0];
}

async function confirm(cookie: string) {
  return app.inject({
    method: "POST",
    url: "/api/v1/courses/checkout/confirm",
    headers: { cookie, "content-type": "application/json" },
    payload: { sessionId: "cs_test_owned_payment" },
  });
}

async function postWebhook(
  paymentStatus: "paid" | "unpaid",
  eventId: string,
  metadata?: { userId?: string; courseId?: string; enrollmentId?: string },
  amountTotal = 4900
) {
  const payload = checkoutCompletedPayload(
    {
      customer: "cus_bruno_payment_owned",
      payment_status: paymentStatus,
      amount_total: amountTotal,
      metadata: metadata ?? {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId: `${fixtures.ids.pendingCourse}-enrollment-a`,
      },
    },
    eventId
  );
  return app.inject({
    method: "POST",
    url: "/api/v1/webhooks/stripe",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signWebhook(payload, config.stripeWebhookSecret),
    },
    payload,
  });
}

describe("checkout confirmation and signed payment webhooks", () => {
  beforeAll(async () => {
    fixtures = await setupProductFixtures(scope);
    app = await build();
    await app.ready();
    learnerACookie = await login(fixtures.actors.learnerA.email, fixtures.actors.learnerA.password);
    learnerBCookie = await login(fixtures.actors.learnerB.email, fixtures.actors.learnerB.password);
    await db
      .update(schema.user)
      .set({ stripeCustomerId: "cus_bruno_payment_learner_b" })
      .where(eq(schema.user.id, fixtures.actors.learnerB.id));
    await db.insert(schema.enrollment).values({
      id: `${fixtures.ids.pendingCourse}-enrollment-b`,
      userId: fixtures.actors.learnerB.id,
      courseId: fixtures.ids.pendingCourse,
      amount: 49,
      status: "Pending",
    });
    jest.spyOn(app.services.stripe.customers, "create").mockResolvedValue({ id: "cus_bruno_payment_owned" } as never);
    jest.spyOn(app.services.stripe.checkout.sessions, "create").mockResolvedValue({
      id: "cs_test_owned_payment",
      url: "https://checkout.stripe.test/cs_test_owned_payment",
    } as never);
    jest
      .spyOn(app.services.stripe.checkout.sessions, "retrieve")
      .mockImplementation(async () => checkoutSession as Stripe.Response<Stripe.Checkout.Session>);
  });

  afterAll(async () => {
    if (app) await app.close();
    try {
      if (fixtures) await cleanupProductFixtures(fixtures);
    } finally {
      await client.end();
    }
  });

  it("creates a real pending checkout, rejects invalid confirmation, and activates once via signed webhook replay", async () => {
    const started = await app.inject({
      method: "POST",
      url: "/api/v1/courses/enroll",
      headers: { cookie: learnerACookie, "content-type": "application/json" },
      payload: { courseId: fixtures.ids.pendingCourse },
    });
    expect(started.statusCode).toBe(200);
    expect(started.json().checkoutUrl).toContain("cs_test_owned_payment");
    expect(app.services.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        metadata: {
          userId: fixtures.actors.learnerA.id,
          courseId: fixtures.ids.pendingCourse,
          enrollmentId: `${fixtures.ids.pendingCourse}-enrollment-a`,
        },
        line_items: [{ price_data: expect.objectContaining({ unit_amount: 4900 }), quantity: 1 }],
      })
    );

    const enrollmentId = `${fixtures.ids.pendingCourse}-enrollment-a`;
    const original = await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) });
    expect(original).toMatchObject({ amount: 49, status: "Pending" });

    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "unpaid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: { userId: fixtures.actors.learnerA.id, courseId: fixtures.ids.pendingCourse, enrollmentId },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(400);
    expect((await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) }))?.status).toBe(
      "Pending"
    );

    const beforeEnrollmentStats = await app.services.courses.getEnrollmentStats();
    const invalidSignedEvents = [
      await postWebhook("paid", "evt_bruno_wrong_owner", {
        userId: fixtures.actors.learnerB.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId,
      }),
      await postWebhook("paid", "evt_bruno_wrong_course", {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.activeCourse,
        enrollmentId,
      }),
      await postWebhook("paid", "evt_bruno_missing_metadata", { userId: fixtures.actors.learnerA.id }),
      await postWebhook("paid", "evt_bruno_unknown_enrollment", {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId: "missing-enrollment",
      }),
      await postWebhook("paid", "evt_bruno_wrong_amount", undefined, 4800),
    ];
    expect(invalidSignedEvents.map((response) => response.statusCode)).toEqual([400, 400, 400, 400, 400]);
    expect((await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) }))?.status).toBe(
      "Pending"
    );

    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: { userId: fixtures.actors.learnerB.id, courseId: fixtures.ids.pendingCourse, enrollmentId },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(403);
    expect((await confirm(learnerBCookie)).statusCode).toBe(403);

    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_learner_b",
      metadata: { userId: fixtures.actors.learnerA.id, courseId: fixtures.ids.pendingCourse, enrollmentId },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(403);

    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: { userId: fixtures.actors.learnerA.id, courseId: fixtures.ids.activeCourse, enrollmentId },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(400);
    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: { userId: fixtures.actors.learnerA.id },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(400);
    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId: "missing-enrollment",
      },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(404);
    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId: `${fixtures.ids.pendingCourse}-enrollment-b`,
      },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(403);

    const unpaidWebhook = await postWebhook("unpaid", "evt_bruno_unpaid_before_paid");
    expect(unpaidWebhook.statusCode).toBe(200);
    expect((await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) }))?.status).toBe(
      "Pending"
    );

    checkoutSession = {
      id: "cs_test_owned_payment",
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_payment_owned",
      metadata: { userId: fixtures.actors.learnerA.id, courseId: fixtures.ids.pendingCourse, enrollmentId },
    };
    expect((await confirm(learnerACookie)).statusCode).toBe(200);
    const webhookReplays = await Promise.all([
      postWebhook("paid", "evt_bruno_paid_replay_a"),
      postWebhook("paid", "evt_bruno_paid_replay_b"),
    ]);
    expect(webhookReplays.map((response) => response.statusCode)).toEqual([200, 200]);

    const active = await db.query.enrollment.findMany({
      where: eq(schema.enrollment.id, enrollmentId),
    });
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({
      userId: fixtures.actors.learnerA.id,
      courseId: fixtures.ids.pendingCourse,
      amount: 4900,
      status: "Active",
    });
    const afterEnrollmentStats = await app.services.courses.getEnrollmentStats();
    expect(afterEnrollmentStats.reduce((total, day) => total + day.enrollments, 0)).toBe(
      beforeEnrollmentStats.reduce((total, day) => total + day.enrollments, 0) + 1
    );
    const learnerAEnrolled = await app.inject({
      method: "GET",
      url: "/api/v1/courses/enrolled",
      headers: { cookie: learnerACookie },
    });
    const learnerBEnrolled = await app.inject({
      method: "GET",
      url: "/api/v1/courses/enrolled",
      headers: { cookie: learnerBCookie },
    });
    expect(
      learnerAEnrolled.json().some((row: { courseId: string }) => row.courseId === fixtures.ids.pendingCourse)
    ).toBe(true);
    expect(
      learnerBEnrolled.json().some((row: { courseId: string }) => row.courseId === fixtures.ids.pendingCourse)
    ).toBe(false);
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/courses/${fixtures.ids.pendingCourse}/is-enrolled`,
          headers: { cookie: learnerACookie },
        })
      ).json()
    ).toEqual({ enrolled: true });
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/courses/${fixtures.ids.pendingCourse}/is-enrolled`,
          headers: { cookie: learnerBCookie },
        })
      ).json()
    ).toEqual({ enrolled: false });
    const repeatedEnrollment = await app.inject({
      method: "POST",
      url: "/api/v1/courses/enroll",
      headers: { cookie: learnerACookie, "content-type": "application/json" },
      payload: { courseId: fixtures.ids.pendingCourse },
    });
    expect(repeatedEnrollment.statusCode).toBe(200);
    expect(repeatedEnrollment.json().checkoutUrl).toBeUndefined();
    expect(app.services.stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });
});
