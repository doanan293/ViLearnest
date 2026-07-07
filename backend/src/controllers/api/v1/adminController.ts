import type { FastifyRequest } from "fastify";
import type { CourseService } from "../../../services/courseService.js";
import { requireAdmin } from "../../../utils/auth.js";

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

  async listRecentCourses(request: FastifyRequest) {
    await requireAdmin(request);
    return this.courseService.listRecentCourses();
  }

  async listAdminCourses(request: FastifyRequest) {
    await requireAdmin(request);
    return this.courseService.listAdminCourses();
  }

  async createCourse(request: FastifyRequest<{ Body: Parameters<CourseService["createCourse"]>[0] }>) {
    const session = await requireAdmin(request);
    return this.courseService.createCourse(request.body, session.user.id);
  }

  async getAdminCourse(request: FastifyRequest<{ Params: { id: string } }>) {
    await requireAdmin(request);
    return this.courseService.getAdminCourse(request.params.id);
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

  async createChapter(request: FastifyRequest<{ Params: { courseId: string }; Body: { name: string } }>) {
    await requireAdmin(request);
    return this.courseService.createChapter(request.params.courseId, request.body.name);
  }

  async deleteChapter(request: FastifyRequest<{ Params: { chapterId: string } }>) {
    await requireAdmin(request);
    return this.courseService.deleteChapter(request.params.chapterId);
  }

  async reorderChapters(request: FastifyRequest<{ Body: { items: { id: string; position: number }[] } }>) {
    await requireAdmin(request);
    return this.courseService.reorderChapters(request.body.items);
  }

  async createLesson(request: FastifyRequest<{ Params: { chapterId: string }; Body: { name: string } }>) {
    await requireAdmin(request);
    return this.courseService.createLesson(request.params.chapterId, request.body.name);
  }

  async getAdminLesson(request: FastifyRequest<{ Params: { id: string } }>) {
    await requireAdmin(request);
    return this.courseService.getAdminLesson(request.params.id);
  }

  async updateLesson(
    request: FastifyRequest<{
      Params: { lessonId: string };
      Body: {
        name: string;
        description?: string;
        thumbnailKey?: string;
        videoKey?: string;
      };
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
