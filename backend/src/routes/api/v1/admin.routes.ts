import type { FastifyPluginAsync } from "fastify";
import { AdminController } from "../../../controllers/api/v1/adminController.js";
import { courseCreateBodySchema, errorResponseSchema, idParamSchema, successMessageSchema } from "../../schemas.js";
import { adminUsersRoutes } from "./admin-users.routes.js";

const anySchema = {} as const;

const chapterBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: true,
  properties: {
    name: { type: "string", minLength: 1 },
    courseId: { type: "string" },
  },
} as const;

const lessonBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: true,
  properties: {
    name: { type: "string", minLength: 1 },
    courseId: { type: "string" },
    chapterId: { type: "string" },
    description: { type: "string" },
    thumbnailKey: { type: "string" },
    videoKey: { type: "string" },
  },
} as const;

const createdChapterResponseSchema = {
  type: "object",
  required: ["status", "message", "chapter"],
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["success"] },
    message: { type: "string" },
    chapter: {
      type: "object",
      required: ["id", "title", "position"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        position: { type: "number" },
      },
    },
  },
} as const;

const createdLessonResponseSchema = {
  type: "object",
  required: ["status", "message", "lesson"],
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["success"] },
    message: { type: "string" },
    lesson: {
      type: "object",
      required: ["id", "title", "position"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        position: { type: "number" },
      },
    },
  },
} as const;

const reorderBodySchema = {
  type: "object",
  required: ["items"],
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "position"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          position: { type: "number" },
        },
      },
    },
  },
} as const;

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AdminController(fastify.services.courses);

  await fastify.register(adminUsersRoutes, { prefix: "/users" });

  fastify.get(
    "/dashboard/stats",
    {
      schema: {
        response: { 200: anySchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.getDashboardStats(request)
  );

  fastify.get(
    "/dashboard/enrollment-stats",
    {
      schema: {
        response: {
          200: { type: "array", items: anySchema },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getEnrollmentStats(request)
  );

  fastify.get(
    "/courses/recent",
    {
      schema: {
        response: {
          200: { type: "array", items: anySchema },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.listRecentCourses(request)
  );

  fastify.get(
    "/courses",
    {
      schema: {
        response: {
          200: { type: "array", items: anySchema },
          401: errorResponseSchema,
        },
      },
    },
    async (request) => controller.listAdminCourses(request)
  );

  fastify.post<{ Body: Parameters<AdminController["createCourse"]>[0]["body"] }>(
    "/courses",
    {
      schema: {
        body: courseCreateBodySchema,
        response: {
          200: successMessageSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request) => controller.createCourse(request)
  );

  fastify.get<{ Params: { id: string } }>(
    "/courses/:id",
    {
      schema: {
        params: idParamSchema,
        response: {
          200: anySchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getAdminCourse(request)
  );

  fastify.put<{ Params: { id: string }; Body: Parameters<AdminController["updateCourse"]>[0]["body"] }>(
    "/courses/:id",
    {
      schema: {
        params: idParamSchema,
        body: courseCreateBodySchema,
        response: {
          200: successMessageSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.updateCourse(request)
  );

  fastify.delete<{ Params: { id: string } }>(
    "/courses/:id",
    {
      schema: {
        params: idParamSchema,
        response: {
          200: successMessageSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.deleteCourse(request)
  );

  fastify.post<{ Params: { courseId: string }; Body: { name: string } }>(
    "/courses/:courseId/chapters",
    {
      schema: {
        body: chapterBodySchema,
        response: { 200: createdChapterResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.createChapter(request)
  );

  fastify.delete<{ Params: { chapterId: string } }>(
    "/chapters/:chapterId",
    {
      schema: {
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.deleteChapter(request)
  );

  fastify.post<{ Body: { items: { id: string; position: number }[] } }>(
    "/chapters/reorder",
    {
      schema: {
        body: reorderBodySchema,
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.reorderChapters(request)
  );

  fastify.post<{ Params: { chapterId: string }; Body: { name: string } }>(
    "/chapters/:chapterId/lessons",
    {
      schema: {
        body: lessonBodySchema,
        response: { 200: createdLessonResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.createLesson(request)
  );

  fastify.get<{ Params: { id: string } }>(
    "/lessons/:id",
    {
      schema: {
        params: idParamSchema,
        response: {
          200: anySchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => controller.getAdminLesson(request)
  );

  fastify.put<{
    Params: { lessonId: string };
    Body: {
      name: string;
      description?: string;
      thumbnailKey?: string;
      videoKey?: string;
    };
  }>(
    "/lessons/:lessonId",
    {
      schema: {
        body: lessonBodySchema,
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.updateLesson(request)
  );

  fastify.delete<{ Params: { lessonId: string } }>(
    "/lessons/:lessonId",
    {
      schema: {
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.deleteLesson(request)
  );

  fastify.post<{ Body: { items: { id: string; position: number }[] } }>(
    "/lessons/reorder",
    {
      schema: {
        body: reorderBodySchema,
        response: { 200: successMessageSchema, 401: errorResponseSchema },
      },
    },
    async (request) => controller.reorderLessons(request)
  );
};
