import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { buildBrunoPaymentWebhookRuntime } from "./brunoPaymentWebhook.js";
import { BRUNO_SEED_IDS } from "./brunoSeedData.js";

type PaymentRuntimeEnv = Record<string, string | undefined>;

export function getBrunoPaymentWebhookSecret(env: PaymentRuntimeEnv = process.env) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || webhookSecret === "mock-webhook-secret") {
    throw new Error("STRIPE_WEBHOOK_SECRET must be configured before exporting Bruno payment webhook runtime values");
  }
  return webhookSecret;
}

export async function readPendingBrunoPaymentState() {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, BRUNO_SEED_IDS.user),
  });

  if (!user) {
    throw new Error(`Bruno user ${BRUNO_SEED_IDS.user} was not found`);
  }

  if (!user.stripeCustomerId) {
    throw new Error(`Bruno user ${BRUNO_SEED_IDS.user} does not have a Stripe customer ID after enroll`);
  }

  const enrollment = await db.query.enrollment.findFirst({
    where: and(eq(schema.enrollment.userId, user.id), eq(schema.enrollment.courseId, BRUNO_SEED_IDS.paymentCourse)),
  });

  if (!enrollment) {
    throw new Error(`Pending enrollment for ${BRUNO_SEED_IDS.paymentCourse} was not found`);
  }

  if (enrollment.status !== "Pending") {
    throw new Error(`Expected pending enrollment for ${BRUNO_SEED_IDS.paymentCourse}, got ${enrollment.status}`);
  }

  return {
    stripeCustomerId: user.stripeCustomerId,
    enrollmentId: enrollment.id,
    amountTotal: 4900,
  };
}

export async function exportBrunoPaymentWebhookRuntime(env: PaymentRuntimeEnv = process.env) {
  const webhookSecret = getBrunoPaymentWebhookSecret(env);
  const state = await readPendingBrunoPaymentState();

  return buildBrunoPaymentWebhookRuntime(
    {
      stripeCustomerId: state.stripeCustomerId,
      enrollmentId: state.enrollmentId,
      amountTotal: state.amountTotal,
    },
    webhookSecret
  );
}
