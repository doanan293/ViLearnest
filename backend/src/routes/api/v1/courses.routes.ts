import type { FastifyPluginAsync } from "fastify";
import { CourseController } from "../../../controllers/api/v1/courseController.js";
import { courseIdParamSchema, errorResponseSchema, successMessageSchema } from "../../schemas.js";

const slugParamSchema = {
  type: "object",
  required: ["slug"],
  properties: { slug: { type: "string", minLength: 1 } },
} as const;

const lessonIdParamSchema = {
  type: "object",
  required: ["lessonId"],
  properties: { lessonId: { type: "string", minLength: 1 } },
} as const;

const enrollBodySchema = {
  type: "object",
  required: ["courseId"],
  additionalProperties: false,
  properties: { courseId: { type: "string", minLength: 1 } },
} as const;

const confirmCheckoutBodySchema = {
  type: "object",
  required: ["sessionId"],
  additionalProperties: false,
  properties: { sessionId: { type: "string", minLength: 1 } },
} as const;

const markCompleteBodySchema = {
  type: "object",
  required: ["lessonId"],
  additionalProperties: true,
  properties: {
    lessonId: { type: "string", minLength: 1 },
    slug: { type: "string" },
  },
} as const;

const anySchema = {} as const;

export const coursesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new CourseController(fastify.services.courses);

  fastify.get(
    "",
    {
      schema: {
        response: { 200: { type: "array", items: anySchema } },
      },
    },
    async () => controller.listPublishedCourses()
  );

  fastify.get<{ Params: { slug: string } }>(
    "/by-slug/:slug",
    {
      schema: {
        params: slugParamSchema,
        response: { 200: anySchema, 404: errorResponseSchema },
      },
    },
    async (request) => controller.getCourseBySlug(request)
  );

  fastify.get<{ Params: { slug: string } }>(
    "/by-slug/:slug/sidebar",
    {
      schema: {
        params: slugParamSchema,
        response: {
          200: anySchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getSidebarData(request)
  );

  fastify.get<{ Params: { lessonId: string } }>(
    "/lessons/:lessonId",
    {
      schema: {
        params: lessonIdParamSchema,
        response: {
          200: anySchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getLessonContent(request)
  );

  fastify.get(
    "/enrolled",
    {
      schema: {
        response: {
          200: { type: "array", items: anySchema },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.listEnrolledCourses(request)
  );

  fastify.get<{ Params: { courseId: string } }>(
    "/:courseId/is-enrolled",
    {
      schema: {
        params: courseIdParamSchema,
        response: {
          200: {
            type: "object",
            required: ["enrolled"],
            properties: { enrolled: { type: "boolean" } },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.isEnrolled(request)
  );

  fastify.post<{ Body: { courseId: string } }>(
    "/enroll",
    {
      schema: {
        body: enrollBodySchema,
        response: {
          200: {
            type: "object",
            required: ["status", "message"],
            properties: {
              status: { type: "string", enum: ["success", "error"] },
              message: { type: "string" },
              checkoutUrl: { type: "string" },
            },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.enroll(request)
  );

  fastify.post<{ Body: { sessionId: string } }>(
    "/checkout/confirm",
    {
      schema: {
        body: confirmCheckoutBodySchema,
        response: {
          200: successMessageSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request) => controller.confirmCheckout(request)
  );

  fastify.post<{ Body: { lessonId: string } }>(
    "/lesson/complete",
    {
      schema: {
        body: markCompleteBodySchema,
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.markComplete(request)
  );
};
