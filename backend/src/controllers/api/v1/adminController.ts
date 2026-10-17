import type { FastifyRequest } from "fastify";
import { parseLocale } from "../../../lib/localize.js";
import type { BilingualName, CourseService, LessonInput } from "../../../services/courseService.js";
import { requireAdmin } from "../../../utils/auth.js";

type LocaleQuery = { Querystring: { locale?: string } };

export class AdminController {
  constructor(private readonly courseService: CourseService) {}

  async getDashboardStats(request: FastifyRequest) {
    await requireAdmin(request);
    return this.courseService.getDashboardStats();
  }

  async getEnrollmentStats(request: FastifyRequest) {
    await requireAdmin(request);
    return this.courseService.getEnrollmentStats();
  }

  async listRecentCourses(request: FastifyRequest<LocaleQuery>) {
    await requireAdmin(request);
    return this.courseService.listRecentCourses(parseLocale(request.query.locale));
  }

  async listAdminCourses(request: FastifyRequest<LocaleQuery>) {
    await requireAdmin(request);
    return this.courseService.listAdminCourses(parseLocale(request.query.locale));
  }

  async createCourse(request: FastifyRequest<{ Body: Parameters<CourseService["createCourse"]>[0] }>) {
    const session = await requireAdmin(request);
    return this.courseService.createCourse(request.body, session.user.id);
  }

  async getAdminCourse(request: FastifyRequest<{ Params: { id: string } } & LocaleQuery>) {
    await requireAdmin(request);
    return this.courseService.getAdminCourse(request.params.id, parseLocale(request.query.locale));
  }

  async updateCourse(
    request: FastifyRequest<{ Params: { id: string }; Body: Parameters<CourseService["createCourse"]>[0] }>
  ) {
    await requireAdmin(request);
    return this.courseService.updateCourse(request.params.id, request.body);
  }

  async deleteCourse(request: FastifyRequest<{ Params: { id: string } }>) {
    await requireAdmin(request);
    return this.courseService.deleteCourse(request.params.id);
  }

  async createChapter(request: FastifyRequest<{ Params: { courseId: string }; Body: BilingualName }>) {
    await requireAdmin(request);
    return this.courseService.createChapter(request.params.courseId, request.body);
  }

  async deleteChapter(request: FastifyRequest<{ Params: { chapterId: string } }>) {
    await requireAdmin(request);
    return this.courseService.deleteChapter(request.params.chapterId);
  }

  async reorderChapters(request: FastifyRequest<{ Body: { items: { id: string; position: number }[] } }>) {
    await requireAdmin(request);
    return this.courseService.reorderChapters(request.body.items);
  }

  async createLesson(request: FastifyRequest<{ Params: { chapterId: string }; Body: BilingualName }>) {
    await requireAdmin(request);
    return this.courseService.createLesson(request.params.chapterId, request.body);
  }

  async getAdminLesson(request: FastifyRequest<{ Params: { id: string } }>) {
    await requireAdmin(request);
    return this.courseService.getAdminLesson(request.params.id);
  }

  async updateLesson(
    request: FastifyRequest<{
      Params: { lessonId: string };
      Body: LessonInput;
    }>
  ) {
    await requireAdmin(request);
    return this.courseService.updateLesson(request.params.lessonId, request.body);
  }

  async deleteLesson(request: FastifyRequest<{ Params: { lessonId: string } }>) {
    await requireAdmin(request);
    return this.courseService.deleteLesson(request.params.lessonId);
  }

  async reorderLessons(request: FastifyRequest<{ Body: { items: { id: string; position: number }[] } }>) {
    await requireAdmin(request);
    return this.courseService.reorderLessons(request.body.items);
  }
}
