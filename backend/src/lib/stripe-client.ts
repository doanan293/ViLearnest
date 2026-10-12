import type Stripe from "stripe";

// Stripe's types are derived from the client instance. Under CommonJS typings (which Vercel's
// builder uses) the default export is a constructor merged with a namespace that exposes only
// the class, so neither `Stripe` nor `Stripe.Checkout.*` can be named as types there.
export type StripeClient = InstanceType<typeof Stripe>;

type CheckoutSessions = StripeClient["checkout"]["sessions"];

export type CheckoutSession = Omit<Awaited<ReturnType<CheckoutSessions["retrieve"]>>, "lastResponse">;

export type CheckoutLineItem = NonNullable<
  NonNullable<Parameters<CheckoutSessions["create"]>[0]>["line_items"]
>[number];
