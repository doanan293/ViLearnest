import Stripe from "stripe";
export function checkoutCompletedPayload(session: Partial<Stripe.Checkout.Session>, eventId: string): string {
  return JSON.stringify({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: { id: "cs_test_payment", object: "checkout.session", mode: "payment", currency: "usd", ...session },
    },
  });
}
export function signWebhook(payload: string, secret: string): string {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret });
}
