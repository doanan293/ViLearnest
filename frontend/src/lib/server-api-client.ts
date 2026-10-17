import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import type { AdminUserSummary, ProfileResponse } from "@/features/users";

type ApiResult<T> = {
	status: number;
	body: T;
};

type ParamsArg<T extends Record<string, string>> = {
	params: T;
};

export type UserSessionResponse = {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role?: string | null;
	};
	session: Record<string, unknown>;
};

type LessonProgressResponse = {
	id?: string;
	completed: boolean;
	lessonId: string;
};

type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
type CourseStatus = "Draft" | "Published" | "Archived";

// Public reads are resolved to the page locale; a text field is null when neither language has it.
type BaseCourseResponse = {
	id: string;
	title: string;
	description: string | null;
	fileKey: string;
	price: number;
	duration: number;
	level: CourseLevel;
	category: string;
	smallDescription: string | null;
	slug: string;
};

type BilingualText = { titleEn: string | null; titleVi: string | null };

type PublicCourseResponse = BaseCourseResponse & {
	chapter: Array<{
		id: string;
		title: string;
		lessons: Array<{ id: string; title: string }>;
	}>;
};

type CourseSidebarResponse = {
	course: BaseCourseResponse & {
		chapter: Array<{
			id: string;
			title: string;
			position: number;
			lessons: Array<{
				id: string;
				title: string;
				position: number;
				description: string | null;
				lessonProgess: Array<LessonProgressResponse>;
			}>;
		}>;
	};
};

type EnrolledCourseResponse = {
	Course: CourseSidebarResponse["course"];
};

type LessonContentResponse = {
	id: string;
	title: string;
	description: string | null;
	thumbnailKey: string | null;
	videoKey: string | null;
	position: number;
	lessonProgess: Array<LessonProgressResponse>;
	Chapter: {
		courseId: string;
		Course: { slug: string };
	};
};

// Admin reads carry both languages for editing plus a display title in the admin's language.
export type AdminCourseResponse = Omit<BaseCourseResponse, "description" | "smallDescription"> &
	BilingualText & {
		smallDescriptionEn: string | null;
		smallDescriptionVi: string | null;
		descriptionEn: string | null;
		descriptionVi: string | null;
		status: CourseStatus;
		chapter: Array<
			BilingualText & {
				id: string;
				title: string;
				position: number;
				lessons: Array<
					BilingualText & {
						id: string;
						title: string;
						descriptionEn: string | null;
						descriptionVi: string | null;
						thumbnailKey: string | null;
						position: number;
						videoKey: string | null;
					}
				>;
			}
		>;
	};

type AdminLessonResponse = BilingualText & {
	id: string;
	descriptionEn: string | null;
	descriptionVi: string | null;
	thumbnailKey: string | null;
	videoKey: string | null;
	position: number;
};

type DashboardStatsResponse = {
	totalSignups: number;
	totalCustomers: number;
	totalCourses: number;
	totalLessons: number;
};

type EnrollmentStatsResponse = Array<{ date: string; enrollments: number }>;

async function request<T = unknown>(
	path: string,
	options: RequestInit & { cookie?: string } = {},
): Promise<ApiResult<T>> {
	const baseUrl =
		process.env.INTERNAL_API_URL || process.env.PUBLIC_API_URL || "http://localhost:5000";
	const { cookie, headers: requestHeaders, ...fetchOptions } = options;
	const headers = new Headers(requestHeaders);

	if (
		fetchOptions.body !== undefined &&
		fetchOptions.body !== null &&
		!headers.has("Content-Type")
	) {
		headers.set("Content-Type", "application/json");
	}
	if (cookie) {
		headers.set("cookie", cookie);
	}

	const response = await fetch(`${baseUrl}${path}`, {
		...fetchOptions,
		headers,
		cache: "no-store",
	});

	const text = await response.text();
	const body = text ? JSON.parse(text) : null;
	return { status: response.status, body };
}

export async function getServerApiClient() {
	const reqHeaders = await headers();
	const cookie = reqHeaders.get("cookie") || "";
	// Course content is served in the page's language.
	const localeQuery = `?locale=${await getLocale()}`;

	const get = <T = unknown>(path: string) => request<T>(path, { cookie });
	const post = <T = unknown>(path: string, body?: unknown) =>
		request<T>(path, {
			method: "POST",
			cookie,
			body: body === undefined ? undefined : JSON.stringify(body),
		});

	return {
		auth: {
			getSession: () => {
				if (!cookie.includes("session_token")) {
					return Promise.resolve({ status: 401, body: null as unknown as UserSessionResponse });
				}
				return get<UserSessionResponse>("/api/v1/auth/session");
			},
		},
		profile: {
			getMe: () => get<ProfileResponse>("/api/v1/profile/me"),
		},
		courses: {
			getAllCourses: () => get<Array<PublicCourseResponse>>(`/api/v1/courses${localeQuery}`),
			getBySlug: ({ params }: ParamsArg<{ slug: string }>) =>
				get<PublicCourseResponse>(`/api/v1/courses/by-slug/${params.slug}${localeQuery}`),
			getSidebarData: ({ params }: ParamsArg<{ slug: string }>) =>
				get<CourseSidebarResponse>(`/api/v1/courses/by-slug/${params.slug}/sidebar${localeQuery}`),
			getLessonContent: ({ params }: ParamsArg<{ lessonId: string }>) =>
				get<LessonContentResponse>(`/api/v1/courses/lessons/${params.lessonId}${localeQuery}`),
			getEnrolledCourses: () =>
				get<Array<EnrolledCourseResponse>>(`/api/v1/courses/enrolled${localeQuery}`),
			isEnrolled: ({ params }: ParamsArg<{ courseId: string }>) =>
				get<{ enrolled: boolean }>(`/api/v1/courses/${params.courseId}/is-enrolled`),
		},
		admin: {
			users: {
				getUsers: () => get<Array<AdminUserSummary>>("/api/v1/admin/users"),
				getUserProfile: ({ params }: ParamsArg<{ userId: string }>) =>
					get<ProfileResponse>(`/api/v1/admin/users/${params.userId}/profile`),
			},
			courses: {
				createCourse: {
					mutation: ({ body }: { body: unknown }) => post("/api/v1/admin/courses", body),
				},
				getCourses: () => get<Array<AdminCourseResponse>>("/api/v1/admin/courses"),
				getCourse: ({ params }: ParamsArg<{ id: string }>) =>
					get<AdminCourseResponse>(`/api/v1/admin/courses/${params.id}`),
				getLesson: ({ params }: ParamsArg<{ id: string }>) =>
					get<AdminLessonResponse>(`/api/v1/admin/lessons/${params.id}`),
				getDashboardStats: () => get<DashboardStatsResponse>("/api/v1/admin/dashboard/stats"),
				getEnrollmentStats: () =>
					get<EnrollmentStatsResponse>("/api/v1/admin/dashboard/enrollment-stats"),
				getRecentCourses: () => get<Array<AdminCourseResponse>>("/api/v1/admin/courses/recent"),
			},
		},
	};
}
