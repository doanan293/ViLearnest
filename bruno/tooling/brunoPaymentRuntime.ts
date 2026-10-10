import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { config } from "../../backend/src/config/index.js";
import { db } from "../../backend/src/db/index.js";
import * as schema from "../../backend/src/db/schema.js";
import { buildBrunoPaymentWebhookRuntime } from "./brunoPaymentWebhook.js";
import { recordResource } from "./fixtures/fixtures.js";
import { readRunManifest } from "./fixtures/runStore.js";
import type { OwnedResource, RunRef } from "./fixtures/types.js";

export type BrunoPaymentEventVariant =
  | "paid"
  | "unpaid"
  | "wrong-owner"
  | "wrong-course"
  | "missing-metadata"
  | "unknown-enrollment";
type PaymentRuntimeResource = Extract<OwnedResource, { kind: "stripe-customer" | "stripe-session" }>;

const paymentStripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2025-12-15.clover" as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
});

type PaymentRuntimeEnv = Record<string, string | undefined>;

export function getBrunoPaymentWebhookSecret(env: PaymentRuntimeEnv = process.env) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || webhookSecret === "mock-webhook-secret") {
    throw new Error("STRIPE_WEBHOOK_SECRET must be configured before exporting Bruno payment webhook runtime values");
  }
  return webhookSecret;
}

async function readRunPaymentState(ref: RunRef) {
  if (ref.suite !== "payment") throw new Error("payment helpers require the payment suite");
  const manifest = await readRunManifest(ref);
  if (manifest?.status !== "active") throw new Error("active payment run was not found");
  const userId = manifest.actors.learnerA.id;
  const courseId = manifest.ids.pendingCourse;
  if (!courseId) throw new Error("payment course fixture is missing");
  const [user, enrollment] = await Promise.all([
    db.query.user.findFirst({ where: eq(schema.user.id, userId) }),
    db.query.enrollment.findFirst({
      where: and(eq(schema.enrollment.userId, userId), eq(schema.enrollment.courseId, courseId)),
    }),
  ]);
  if (!user?.stripeCustomerId) throw new Error("payment actor has no Stripe customer after checkout initiation");
  if (enrollment?.status !== "Pending") throw new Error("payment enrollment is not pending");
  if (!Number.isSafeInteger(enrollment.amount * 100)) throw new Error("payment enrollment amount is invalid");
  return {
    userId,
    learnerBId: manifest.actors.learnerB.id,
    courseId,
    wrongCourseId: manifest.ids.activeCourse,
    enrollmentId: enrollment.id,
    amountMinor: enrollment.amount * 100,
    stripeCustomerId: user.stripeCustomerId,
  };
}

export async function buildRunPaymentEvent(
  ref: RunRef,
  variant: BrunoPaymentEventVariant,
  env: PaymentRuntimeEnv = process.env
) {
  const state = await readRunPaymentState(ref);
  const runId = ref.runId.replaceAll("-", "");
  const input = {
    stripeCustomerId: state.stripeCustomerId,
    enrollmentId: state.enrollmentId,
    userId: state.userId,
    courseId: state.courseId,
    amountTotal: state.amountMinor,
    eventId: `evt_bruno_${runId}_${variant.replaceAll("-", "_")}`,
    sessionId: `cs_test_bruno_${runId}_${variant.replaceAll("-", "_")}`,
  };
  const variantInput =
    variant === "unpaid"
      ? { ...input, paymentStatus: "unpaid" as const }
      : variant === "wrong-owner"
        ? {
            ...input,
            metadata: { userId: state.learnerBId, courseId: state.courseId, enrollmentId: state.enrollmentId },
          }
        : variant === "wrong-course"
          ? {
              ...input,
              metadata: { userId: state.userId, courseId: state.wrongCourseId, enrollmentId: state.enrollmentId },
            }
          : variant === "missing-metadata"
            ? { ...input, metadata: { userId: state.userId } }
            : variant === "unknown-enrollment"
              ? { ...input, enrollmentId: `missing-${runId}` }
              : input;
  const runtime = buildBrunoPaymentWebhookRuntime(variantInput, getBrunoPaymentWebhookSecret(env));
  return { payload: runtime.paymentWebhookPayload, signature: runtime.paymentWebhookSignature };
}

export async function trackRunPaymentSession(ref: RunRef, sessionId: string) {
  if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Stripe checkout session ID is invalid");
  const state = await readRunPaymentState(ref);
  const session = await paymentStripe.checkout.sessions.retrieve(sessionId);
  const customerId = session.customer;
  if (
    typeof customerId !== "string" ||
    customerId !== state.stripeCustomerId ||
    session.metadata?.userId !== state.userId ||
    session.metadata?.courseId !== state.courseId ||
    session.metadata?.enrollmentId !== state.enrollmentId
  ) {
    throw new Error("Stripe checkout session does not belong to this payment run");
  }
  await recordResource(ref, { kind: "stripe-customer", id: customerId });
  await recordResource(ref, { kind: "stripe-session", id: session.id });
  return { customerId, sessionId: session.id };
}

export async function cleanupRunPaymentResource(
  ref: RunRef,
  resource: PaymentRuntimeResource
): Promise<"deleted" | "retained"> {
  const manifest = await readRunManifest(ref);
  if (
    !manifest ||
    manifest.status === "cleaned" ||
    !manifest.resources.some((entry) => entry.kind === resource.kind && entry.id === resource.id)
  ) {
    throw new Error("Stripe resource is not registered to this run");
  }

  if (resource.kind === "stripe-session") {
    const session = await paymentStripe.checkout.sessions.retrieve(resource.id);
    if (
      session.metadata?.userId !== manifest.actors.learnerA.id ||
      session.metadata?.courseId !== manifest.ids.pendingCourse ||
      !session.metadata?.enrollmentId
    ) {
      throw new Error("Stripe checkout session is not owned by this run");
    }
    if (session.status === "open") {
      await paymentStripe.checkout.sessions.expire(resource.id);
      return "retained";
    }
    if (session.status === "expired") return "retained";
    return "retained";
  }

  const deleted = await paymentStripe.customers.del(resource.id);
  return deleted.deleted ? "deleted" : "retained";
}

export async function discoverRunPaymentResources(
  ref: RunRef,
  manifest: import("./fixtures/types.js").RunManifest,
  stripe: Stripe = paymentStripe
): Promise<OwnedResource[]> {
  if (ref.suite !== "payment") throw new Error("payment discovery requires the payment suite");
  if (stripe === paymentStripe && !config.stripeSecretKey.startsWith("sk_test_"))
    throw new Error("payment cleanup requires Stripe test credentials");
  const actor = manifest.actors.learnerA;
  const expectedEmail = `bruno-payment-${ref.runId.replaceAll("-", "")}-learner-a@example.com`;
  if (actor.email !== expectedEmail) throw new Error("payment email is not run-owned");
  const resources: OwnedResource[] = [];
  // Exact email plus product metadata recovers even a customer created before its DB link was saved.
  for await (const customer of stripe.customers.list({ email: expectedEmail, limit: 100 })) {
    if (customer.metadata?.userId !== actor.id || customer.email !== expectedEmail)
      throw new Error("payment customer metadata does not match the owned actor");
    resources.push({ kind: "stripe-customer", id: customer.id });
    for await (const session of stripe.checkout.sessions.list({ customer: customer.id, limit: 100 })) {
      if (
        session.metadata?.userId !== actor.id ||
        session.metadata?.courseId !== manifest.ids.pendingCourse ||
        !session.metadata?.enrollmentId
      )
        throw new Error("payment session metadata does not match the owned run");
      resources.push({ kind: "stripe-session", id: session.id });
    }
  }
  return resources;
}
