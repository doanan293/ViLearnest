import type { FastifyPluginAsync } from "fastify";
import { AdminUsersController } from "../../../controllers/api/v1/adminUsersController.js";
import { errorResponseSchema } from "../../schemas.js";

const anySchema = {} as const;

const profileBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    image: { type: ["string", "null"], maxLength: 500 },
    dateOfBirth: { type: ["string", "null"], maxLength: 20 },
    gender: { type: ["string", "null"], maxLength: 40 },
    phoneNumber: { type: ["string", "null"], maxLength: 30 },
    country: { type: ["string", "null"], maxLength: 100 },
    province: { type: ["string", "null"], maxLength: 100 },
    district: { type: ["string", "null"], maxLength: 100 },
    ward: { type: ["string", "null"], maxLength: 100 },
    addressLine: { type: ["string", "null"], maxLength: 240 },
    bio: { type: ["string", "null"], maxLength: 500 },
    facebookUrl: { type: ["string", "null"], maxLength: 240 },
    linkedinUrl: { type: ["string", "null"], maxLength: 240 },
    githubUrl: { type: ["string", "null"], maxLength: 240 },
    websiteUrl: { type: ["string", "null"], maxLength: 240 },
    occupation: { type: ["string", "null"], maxLength: 120 },
    organization: { type: ["string", "null"], maxLength: 160 },
    education: { type: ["string", "null"], maxLength: 160 },
  },
} as const;

const userIdParamSchema = {
  type: "object",
  required: ["userId"],
  additionalProperties: false,
  properties: { userId: { type: "string", minLength: 1 } },
} as const;

export const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AdminUsersController(fastify.services.profiles);

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: { type: "array", items: anySchema },
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request) => controller.listUsers(request)
  );

  fastify.get<{ Params: { userId: string } }>(
    "/:userId/profile",
    {
      schema: {
        params: userIdParamSchema,
        response: {
          200: anySchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getUserProfile(request)
  );

  fastify.put<{ Params: { userId: string }; Body: Parameters<AdminUsersController["updateUserProfile"]>[0]["body"] }>(
    "/:userId/profile",
    {
      schema: {
        params: userIdParamSchema,
        body: profileBodySchema,
        response: {
          200: anySchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.updateUserProfile(request)
  );
};
