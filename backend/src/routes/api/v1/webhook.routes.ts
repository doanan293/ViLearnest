import type { FastifyPluginAsync } from "fastify";
import { config } from "../../../config/index.js";

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/stripe", { config: { rawBody: true } }, async (request, reply) => {
    const body = request.rawBody;
    if (!body) {
      return reply.status(400).send("Webhook Error: Empty body");
    }

    const signature = request.headers["stripe-signature"] as string;
    try {
      const event = fastify.services.stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);

      if (event.type === "checkout.session.completed") {
        await fastify.services.courses.handleCheckoutCompleted(event.data.object);
      }

      return reply.status(200).send({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook payload";
      return reply.status(400).send(`Webhook Error: ${message}`);
    }
  });
};
