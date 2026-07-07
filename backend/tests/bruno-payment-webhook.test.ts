import { createHmac } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getBrunoPaymentWebhookSecret } from "../src/scripts/brunoPaymentRuntime.js";
import {
  buildBrunoCheckoutCompletedPayload,
  buildBrunoPaymentWebhookRuntime,
  buildStripeWebhookSignature,
} from "../src/scripts/brunoPaymentWebhook.js";

describe("bruno payment webhook helpers", () => {
  it("builds a compact checkout.session.completed payload", () => {
    const payload = buildBrunoCheckoutCompletedPayload({
      stripeCustomerId: "cus_bruno",
      enrollmentId: "enrollment-123",
      courseId: "course-123",
      amountTotal: 4900,
      created: 1783100000,
    });

    expect(payload).not.toContain("\n");
    expect(JSON.parse(payload)).toMatchObject({
      type: "checkout.session.completed",
      data: {
        object: {
          object: "checkout.session",
          payment_status: "paid",
          amount_total: 4900,
          customer: "cus_bruno",
          metadata: {
            courseId: "course-123",
            enrollmentId: "enrollment-123",
          },
        },
      },
    });
  });

  it("signs the exact payload using Stripe webhook format", () => {
    const payload = '{"type":"checkout.session.completed"}';
    const timestamp = 1783100000;
    const expected = createHmac("sha256", "whsec_test").update(`${timestamp}.${payload}`).digest("hex");

    expect(buildStripeWebhookSignature(payload, "whsec_test", timestamp)).toBe(`t=${timestamp},v1=${expected}`);
  });

  it("returns Bruno runtime variables", () => {
    const runtime = buildBrunoPaymentWebhookRuntime(
      {
        stripeCustomerId: "cus_bruno",
        enrollmentId: "enrollment-123",
        courseId: "course-123",
        amountTotal: 4900,
        created: 1783100000,
      },
      "whsec_test",
      1783100000
    );

    expect(runtime).toEqual({
      paymentEnrollmentId: "enrollment-123",
      paymentStripeCustomerId: "cus_bruno",
      paymentWebhookPayload: expect.any(String),
      paymentWebhookSignature: expect.stringMatching(/^t=1783100000,v1=/),
    });
  });

  it("requires a real webhook secret for runtime export", () => {
    expect(() => getBrunoPaymentWebhookSecret({})).toThrow(
      "STRIPE_WEBHOOK_SECRET must be configured before exporting Bruno payment webhook runtime values"
    );
    expect(() => getBrunoPaymentWebhookSecret({ STRIPE_WEBHOOK_SECRET: "mock-webhook-secret" })).toThrow(
      "STRIPE_WEBHOOK_SECRET must be configured before exporting Bruno payment webhook runtime values"
    );
    expect(getBrunoPaymentWebhookSecret({ STRIPE_WEBHOOK_SECRET: " whsec_test " })).toBe("whsec_test");
  });
});
