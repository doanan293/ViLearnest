import { createHmac } from "node:crypto";
import { BRUNO_SEED_IDS } from "./brunoSeedData.js";

type WebhookInput = {
  stripeCustomerId: string;
  enrollmentId: string;
  courseId?: string;
  amountTotal?: number;
  created?: number;
  eventId?: string;
  sessionId?: string;
};

export function buildBrunoCheckoutCompletedPayload(input: WebhookInput) {
  const created = input.created ?? Math.floor(Date.now() / 1000);
  return JSON.stringify({
    id: input.eventId ?? "evt_bruno_payment_completed",
    object: "event",
    api_version: "2025-12-15.clover",
    created,
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: "checkout.session.completed",
    data: {
      object: {
        id: input.sessionId ?? "cs_test_bruno_payment_completed",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: input.amountTotal ?? 4900,
        currency: "usd",
        customer: input.stripeCustomerId,
        metadata: {
          courseId: input.courseId ?? BRUNO_SEED_IDS.paymentCourse,
          enrollmentId: input.enrollmentId,
        },
      },
    },
  });
}

export function buildStripeWebhookSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
) {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function buildBrunoPaymentWebhookRuntime(input: WebhookInput, webhookSecret: string, timestamp?: number) {
  const payload = buildBrunoCheckoutCompletedPayload(input);
  return {
    paymentEnrollmentId: input.enrollmentId,
    paymentStripeCustomerId: input.stripeCustomerId,
    paymentWebhookPayload: payload,
    paymentWebhookSignature: buildStripeWebhookSignature(payload, webhookSecret, timestamp),
  };
}
