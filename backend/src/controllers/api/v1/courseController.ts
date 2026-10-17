import type { FastifyRequest } from "fastify";
import { parseLocale } from "../../../lib/localize.js";
import type { CourseService } from "../../../services/courseService.js";
import { requireSession } from "../../../utils/auth.js";

type LocaleQuery = { Querystring: { locale?: string } };

export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  async listPublishedCourses(request: FastifyRequest<LocaleQuery>) {
    return this.courseService.listPublishedCourses(parseLocale(request.query.locale));
  }

  async getCourseBySlug(request: FastifyRequest<{ Params: { slug: string } } & LocaleQuery>) {
    return this.courseService.getCourseBySlug(request.params.slug, parseLocale(request.query.locale));
  }

  async getSidebarData(request: FastifyRequest<{ Params: { slug: string } } & LocaleQuery>) {
    const session = await requireSession(request);
    return this.courseService.getSidebarData(request.params.slug, session.user.id, parseLocale(request.query.locale));
  }

  async getLessonContent(request: FastifyRequest<{ Params: { lessonId: string } } & LocaleQuery>) {
    const session = await requireSession(request);
    return this.courseService.getLessonContent(
      request.params.lessonId,
      session.user.id,
      parseLocale(request.query.locale)
    );
  }

  async listEnrolledCourses(request: FastifyRequest<LocaleQuery>) {
    const session = await requireSession(request);
    return this.courseService.listEnrolledCourses(session.user.id, parseLocale(request.query.locale));
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
