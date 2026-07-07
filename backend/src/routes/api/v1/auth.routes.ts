import type { FastifyPluginAsync } from "fastify";
import { AuthController } from "../../../controllers/api/v1/authController.js";
import { errorResponseSchema } from "../../schemas.js";

const sessionResponseSchema = {
  type: "object",
  required: ["user", "session"],
  properties: {
    user: {
      type: "object",
      required: ["id", "name", "email"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        image: { type: ["string", "null"] },
        role: { type: ["string", "null"] },
      },
    },
    session: {
      type: "object",
      required: ["id", "expiresAt", "userId"],
      properties: {
        id: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
        userId: { type: "string" },
      },
    },
  },
} as const;

const emailExistsBodySchema = {
  type: "object",
  required: ["email"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3 },
  },
} as const;

const emailExistsResponseSchema = {
  type: "object",
  required: ["exists"],
  properties: {
    exists: { type: "boolean" },
  },
} as const;

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuthController();

  fastify.post<{ Body: { email: string } }>(
    "/email-exists",
    {
      schema: {
        body: emailExistsBodySchema,
        response: {
          200: emailExistsResponseSchema,
        },
      },
    },
    async (request) => controller.emailExists(request.body)
  );

  fastify.get(
    "/session",
    {
      schema: {
        response: {
          200: sessionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getSession(request)
  );
};
