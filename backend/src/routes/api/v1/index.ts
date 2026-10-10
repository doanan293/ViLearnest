import type { FastifyPluginAsync } from "fastify";
import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { coursesRoutes } from "./courses.routes.js";
import { profileRoutes } from "./profile.routes.js";
import { storageRoutes } from "./storage.routes.js";
import { webhookRoutes } from "./webhook.routes.js";

export const v1Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({ status: "ok" }));
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(coursesRoutes, { prefix: "/courses" });
  await fastify.register(profileRoutes, { prefix: "/profile" });
  await fastify.register(adminRoutes, { prefix: "/admin" });
  await fastify.register(storageRoutes, { prefix: "/storage" });
  await fastify.register(webhookRoutes, { prefix: "/webhooks" });
};
