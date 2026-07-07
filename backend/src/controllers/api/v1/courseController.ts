import type { FastifyRequest } from "fastify";
import type { CourseService } from "../../../services/courseService.js";
import { requireSession } from "../../../utils/auth.js";

export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  async listPublishedCourses() {
    return this.courseService.listPublishedCourses();
  }

  async getCourseBySlug(request: FastifyRequest<{ Params: { slug: string } }>) {
    return this.courseService.getCourseBySlug(request.params.slug);
  }

  async getSidebarData(request: FastifyRequest<{ Params: { slug: string } }>) {
    const session = await requireSession(request);
    return this.courseService.getSidebarData(request.params.slug, session.user.id);
  }

  async getLessonContent(request: FastifyRequest<{ Params: { lessonId: string } }>) {
    const session = await requireSession(request);
    return this.courseService.getLessonContent(request.params.lessonId, session.user.id);
  }

  async listEnrolledCourses(request: FastifyRequest) {
    const session = await requireSession(request);
    return this.courseService.listEnrolledCourses(session.user.id);
  }

  async isEnrolled(request: FastifyRequest<{ Params: { courseId: string } }>) {
    const session = await requireSession(request);
    return this.courseService.isEnrolled(request.params.courseId, session.user.id);
  }

  async enroll(request: FastifyRequest<{ Body: { courseId: string } }>) {
    const session = await requireSession(request);
    return this.courseService.enroll(request.body.courseId, session.user);
  }

  async confirmCheckout(request: FastifyRequest<{ Body: { sessionId: string } }>) {
    const session = await requireSession(request);
    return this.courseService.confirmCheckoutSession(request.body.sessionId, session.user.id);
  }

  async markComplete(request: FastifyRequest<{ Body: { lessonId: string } }>) {
    const session = await requireSession(request);
    return this.courseService.markComplete(request.body.lessonId, session.user.id);
  }
}
