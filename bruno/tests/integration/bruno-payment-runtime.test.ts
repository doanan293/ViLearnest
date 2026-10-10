import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import { client, db } from "../../../backend/src/db/index.js";
import * as schema from "../../../backend/src/db/schema.js";
import { buildRunPaymentEvent } from "../../tooling/brunoPaymentRuntime.js";
import { cleanupRun, setupRun } from "../../tooling/fixtures/fixtures.js";
import type { RunFixtures, RunRef } from "../../tooling/fixtures/types.js";

const ref: RunRef = { runId: "c23e4567-e89b-42d3-a456-426614174000", suite: "payment" };
let fixtures: RunFixtures;
describe("run payment event generation", () => {
  beforeAll(async () => {
    fixtures = await setupRun(ref);
  });
  afterAll(async () => {
    try {
      await cleanupRun(
        ref,
        undefined,
        async () => "deleted",
        async () => []
      );
    } finally {
      await client.end();
    }
  });
  it("builds signed payment variants only from this run's pending enrollment", async () => {
    await db
      .update(schema.user)
      .set({ stripeCustomerId: "cus_bruno_owned_payment" })
      .where(eq(schema.user.id, fixtures.actors.learnerA.id));
    const secret = "whsec_bruno_payment_test";
    const variants = await Promise.all(
      (["paid", "unpaid", "wrong-owner", "wrong-course", "missing-metadata", "unknown-enrollment"] as const).map(
        (variant) => buildRunPaymentEvent(ref, variant, { STRIPE_WEBHOOK_SECRET: secret })
      )
    );
    const events = variants.map(({ payload }) => JSON.parse(payload));

    expect(events[0].data.object).toMatchObject({
      payment_status: "paid",
      amount_total: 4900,
      customer: "cus_bruno_owned_payment",
      metadata: {
        userId: fixtures.actors.learnerA.id,
        courseId: fixtures.ids.pendingCourse,
        enrollmentId: `${fixtures.ids.pendingCourse}-enrollment-a`,
      },
    });
    expect(events[1].data.object.payment_status).toBe("unpaid");
    expect(events[2].data.object.metadata.userId).toBe(fixtures.actors.learnerB.id);
    expect(events[3].data.object.metadata.courseId).toBe(fixtures.ids.activeCourse);
    expect(events[4].data.object.metadata).toEqual({ userId: fixtures.actors.learnerA.id });
    expect(events[5].data.object.metadata.enrollmentId).toBe(`missing-${ref.runId.replaceAll("-", "")}`);
    for (const { payload, signature } of variants) {
      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
      expect(payload).toContain(ref.runId.replaceAll("-", ""));
    }
  });
});
