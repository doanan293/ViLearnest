import type { FastifyPluginAsync } from "fastify";
import { StorageController } from "../../../controllers/api/v1/storageController.js";
import { errorResponseSchema } from "../../schemas.js";

const presignedBodySchema = {
  type: "object",
  required: ["filename", "contentType"],
  additionalProperties: false,
  properties: {
    filename: { type: "string", minLength: 1 },
    contentType: { type: "string", minLength: 1 },
  },
} as const;

const deleteBodySchema = {
  type: "object",
  required: ["key"],
  additionalProperties: false,
  properties: {
    key: { type: "string", minLength: 1 },
  },
} as const;

export const storageRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new StorageController(fastify.services.storage);

  fastify.post<{ Body: { filename: string; contentType: string } }>(
    "/presigned",
    {
      schema: {
        body: presignedBodySchema,
        response: {
          200: {
            type: "object",
            required: ["uploadUrl", "key"],
            properties: {
              uploadUrl: { type: "string" },
              key: { type: "string" },
            },
          },
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request) => controller.createPresignedUploadUrl(request)
  );

  fastify.delete<{ Body: { key: string } }>(
    "/files",
    {
      schema: {
        body: deleteBodySchema,
        response: {
          200: {
            type: "object",
            required: ["message"],
            properties: { message: { type: "string" } },
          },
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request) => controller.deleteFile(request)
  );
};
