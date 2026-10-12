import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyInstance, type FastifyServerOptions, type onRouteHookHandler } from "fastify";
import fastifyRawBody from "fastify-raw-body";
import { auth } from "./auth.js";
import { config } from "./config/index.js";
import { globalErrorHandler, notFoundHandler } from "./lib/http.js";
import services from "./plugins/services.js";
import { routes } from "./routes/index.js";
import { aj } from "./utils/arcjet.js";

export async function build(
  opts: FastifyServerOptions = {},
  hooks: { onRoute?: onRouteHookHandler } = {}
): Promise<FastifyInstance> {
  const app = Fastify(opts);

  if (hooks.onRoute) app.addHook("onRoute", hooks.onRoute);

  app.setErrorHandler(globalErrorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  });

  await app.register(fastifyRawBody, {
    field: "rawBody",
    global: false,
    encoding: false,
    runFirst: true,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "ViLearnest API",
        version: "1.0.0",
      },
      servers: [{ url: `${config.apiBaseUrl}/api/v1` }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  await app.register(services);

  app.get("/openapi.json", async () => app.swagger());

  app.get("/api/auth/session", async (request) => {
    const headers = fromNodeHeaders(request.headers);
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return { status: "error", message: "Unauthorized" };
    }
    return session;
  });

  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const decision = await aj.protect(request.raw, { requested: 1 });
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return reply.status(429).send({
            status: "error",
            message: "Too many requests. Please try again later.",
          });
        }
        return reply.status(403).send({
          status: "error",
          message: "Access denied by security shield",
        });
      }

      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value: string, key: string) => {
        reply.header(key, value);
      });
      return reply.send(response.body ? await response.text() : null);
    },
  });

  await app.register(routes);

  return app;
}
