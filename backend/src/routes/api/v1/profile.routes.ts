import type { FastifyPluginAsync } from "fastify";
import { ProfileController } from "../../../controllers/api/v1/profileController.js";
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

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new ProfileController(fastify.services.profiles);

  fastify.get(
    "/me",
    {
      schema: {
        response: {
          200: anySchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getMe(request)
  );

  fastify.put<{ Body: Parameters<ProfileController["updateMe"]>[0]["body"] }>(
    "/me",
    {
      schema: {
        body: profileBodySchema,
        response: {
          200: anySchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.updateMe(request)
  );
};
