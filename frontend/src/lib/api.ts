import type {
	AdminCourseSingularType,
	AdminCourseType,
	AdminLessonType,
	CourseSidebarDataType,
	LessonContentType,
	PublicCourseType,
} from "@/features/courses";
import type { AdminUserSummary, EnrolledCourseType, ProfileResponse } from "@/features/users";
import type { Locale } from "@/i18n/pathname";
import { http } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types";
import type {
	ChapterBody,
	CourseSchemaType,
	LessonBody,
	ProfileSchemaType,
} from "@/lib/zodSchemas";

export type CreatedChapter = {
	id: string;
	title: string;
	position: number;
};

export type CreatedLesson = {
	id: string;
	title: string;
	position: number;
};

type CreateChapterResponse = ApiResponse & {
	chapter: CreatedChapter;
};

type CreateLessonResponse = ApiResponse & {
	lesson: CreatedLesson;
};

export const api = {
	auth: {
		emailExists: (email: string) =>
			http.post<{ exists: boolean }>("/api/v1/auth/email-exists", { email }),
	},
	profile: {
		getMe: () => http.get<ProfileResponse>("/api/v1/profile/me"),
		updateMe: (data: ProfileSchemaType) => http.put<ProfileResponse>("/api/v1/profile/me", data),
	},
	adminUsers: {
		getUsers: () => http.get<Array<AdminUserSummary>>("/api/v1/admin/users"),
		getProfile: (userId: string) =>
			http.get<ProfileResponse>(`/api/v1/admin/users/${userId}/profile`),
		updateProfile: (userId: string, data: ProfileSchemaType) =>
			http.put<ProfileResponse>(`/api/v1/admin/users/${userId}/profile`, data),
	},
	admin: {
		getCourses: () => http.get<Array<AdminCourseType>>("/api/v1/admin/courses"),
		getCourse: (courseId: string) =>
			http.get<AdminCourseSingularType>(`/api/v1/admin/courses/${courseId}`),
		getLesson: (lessonId: string) => http.get<AdminLessonType>(`/api/v1/admin/lessons/${lessonId}`),
		getRecentCourses: () => http.get<Array<AdminCourseType>>("/api/v1/admin/courses/recent"),
		getDashboardStats: () =>
			http.get<{
				totalSignups: number;
				totalCustomers: number;
				totalCourses: number;
				totalLessons: number;
			}>("/api/v1/admin/dashboard/stats"),
		getEnrollmentStats: () =>
			http.get<Array<{ date: string; enrollments: number }>>(
				"/api/v1/admin/dashboard/enrollment-stats",
			),

		// Course Operations
		createCourse: (data: CourseSchemaType) => http.post<ApiResponse>("/api/v1/admin/courses", data),
		editCourse: (courseId: string, data: CourseSchemaType) =>
			http.put<ApiResponse>(`/api/v1/admin/courses/${courseId}`, data),
		deleteCourse: (courseId: string) =>
			http.delete<ApiResponse>(`/api/v1/admin/courses/${courseId}`),

		// Chapters
		createChapter: (data: ChapterBody) =>
			http.post<CreateChapterResponse>(`/api/v1/admin/courses/${data.courseId}/chapters`, data),
		deleteChapter: (courseId: string, chapterId: string) =>
			http.delete<ApiResponse>(`/api/v1/admin/chapters/${chapterId}`, { body: { courseId } }),
		reorderChapters: (courseId: string, chapters: Array<{ id: string; position: number }>) =>
			http.post<ApiResponse>("/api/v1/admin/chapters/reorder", {
				courseId,
				items: chapters,
			}),

		// Lessons
		createLesson: (data: LessonBody) =>
			http.post<CreateLessonResponse>(`/api/v1/admin/chapters/${data.chapterId}/lessons`, data),
		updateLesson: (lessonId: string, data: LessonBody) =>
			http.put<ApiResponse>(`/api/v1/admin/lessons/${lessonId}`, data),
		deleteLesson: (courseId: string, chapterId: string, lessonId: string) =>
			http.delete<ApiResponse>(`/api/v1/admin/lessons/${lessonId}`, {
				body: {
					courseId,
					chapterId,
				},
			}),
		reorderLessons: (
			courseId: string,
			chapterId: string,
			lessons: Array<{ id: string; position: number }>,
		) =>
			http.post<ApiResponse>("/api/v1/admin/lessons/reorder", {
				courseId,
				chapterId,
				items: lessons,
			}),
	},
	courses: {
		getAllCourses: (locale: Locale) =>
			http.get<Array<PublicCourseType>>("/api/v1/courses", { params: { locale } }),
		getEnrolledCourses: (locale: Locale) =>
			http.get<Array<EnrolledCourseType>>("/api/v1/courses/enrolled", { params: { locale } }),
		getSidebarData: (slug: string, locale: Locale) =>
			http.get<CourseSidebarDataType>(`/api/v1/courses/by-slug/${slug}/sidebar`, {
				params: { locale },
			}),
		getLessonContent: (lessonId: string, locale: Locale) =>
			http.get<LessonContentType>(`/api/v1/courses/lessons/${lessonId}`, { params: { locale } }),
		isEnrolled: (courseId: string) =>
			http.get<{ enrolled: boolean }>(`/api/v1/courses/${courseId}/is-enrolled`),
		enroll: (courseId: string, locale: Locale) =>
			http.post<
				ApiResponse & {
					checkoutUrl?: string;
				}
			>("/api/v1/courses/enroll", { courseId, locale }),
		confirmCheckout: (sessionId: string) =>
			http.post<ApiResponse>("/api/v1/courses/checkout/confirm", { sessionId }),
		markComplete: (lessonId: string, slug: string) =>
			http.post<ApiResponse>("/api/v1/courses/lesson/complete", { lessonId, slug }),
	},
	s3: {
		getPresignedUrl: (filename: string, contentType: string) =>
			http.post<{ uploadUrl: string; key: string }>("/api/v1/storage/presigned", {
				filename,
				contentType,
			}),
		deleteFile: (key: string) =>
			http.delete<{ message: string }>("/api/v1/storage/files", {
				body: { key },
			}),
	},
};
