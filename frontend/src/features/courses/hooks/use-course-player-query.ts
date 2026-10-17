import { type QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { CourseSidebarDataType, LessonContentType } from "@/features/courses";
import type { Locale } from "@/i18n/pathname";
import { api } from "@/lib/api";
import { ApiClientError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

type QueryFn<T> = () => Promise<T>;

type ProgressSnapshot = {
	sidebar: CourseSidebarDataType | undefined;
	lesson: LessonContentType | undefined;
};

export function courseSidebarQueryOptions(
	slug: string,
	locale: Locale,
	queryFn: QueryFn<CourseSidebarDataType> = () => api.courses.getSidebarData(slug, locale),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.courseSidebar(slug, locale),
		queryFn,
		staleTime: queryStaleTimes.coursePlayer,
	});
}

export function lessonContentQueryOptions(
	lessonId: string,
	locale: Locale,
	queryFn: QueryFn<LessonContentType> = () => api.courses.getLessonContent(lessonId, locale),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.lessonContent(lessonId, locale),
		queryFn,
		staleTime: queryStaleTimes.coursePlayer,
	});
}

export function useCourseSidebarQuery(slug: string) {
	const locale = useLocale() as Locale;
	return useQuery(courseSidebarQueryOptions(slug, locale));
}

export function useLessonContentQuery(lessonId: string) {
	const locale = useLocale() as Locale;
	return useQuery(lessonContentQueryOptions(lessonId, locale));
}

export function enrollmentStatusQueryOptions(
	courseId: string,
	queryFn: QueryFn<boolean> = async () => {
		try {
			const response = await api.courses.isEnrolled(courseId);
			return response.enrolled;
		} catch (error) {
			// Signed-out visitors are simply not enrolled; retrying a 401 only keeps the button loading.
			if (error instanceof ApiClientError && error.statusCode === 401) {
				return false;
			}
			throw error;
		}
	},
) {
	return queryOptions({
		queryKey: queryKeys.courses.enrollmentStatus(courseId),
		queryFn,
		staleTime: queryStaleTimes.enrollment,
	});
}

export function useEnrollmentStatusQuery(courseId: string) {
	return useQuery(enrollmentStatusQueryOptions(courseId));
}

function completedProgress(lessonId: string) {
	return { lessonId, completed: true };
}

export function markLessonContentCompleted(
	queryClient: QueryClient,
	lessonId: string,
	locale: Locale,
) {
	queryClient.setQueryData<LessonContentType>(
		queryKeys.dashboard.lessonContent(lessonId, locale),
		(previous) => {
			if (!previous) {
				return previous;
			}

			const hasProgress = previous.lessonProgess.some((progress) => progress.lessonId === lessonId);

			return {
				...previous,
				lessonProgess: hasProgress
					? previous.lessonProgess.map((progress) =>
							progress.lessonId === lessonId ? { ...progress, completed: true } : progress,
						)
					: [...previous.lessonProgess, completedProgress(lessonId)],
			};
		},
	);
}

export function markSidebarLessonCompleted(
	queryClient: QueryClient,
	slug: string,
	lessonId: string,
	locale: Locale,
) {
	queryClient.setQueryData<CourseSidebarDataType>(
		queryKeys.dashboard.courseSidebar(slug, locale),
		(previous) => {
			if (!previous) {
				return previous;
			}

			return {
				...previous,
				course: {
					...previous.course,
					chapter: previous.course.chapter.map((chapter) => ({
						...chapter,
						lessons: chapter.lessons.map((lesson) => {
							if (lesson.id !== lessonId) {
								return lesson;
							}

							const hasProgress = lesson.lessonProgess.some(
								(progress) => progress.lessonId === lessonId,
							);

							return {
								...lesson,
								lessonProgess: hasProgress
									? lesson.lessonProgess.map((progress) =>
											progress.lessonId === lessonId ? { ...progress, completed: true } : progress,
										)
									: [...lesson.lessonProgess, completedProgress(lessonId)],
							};
						}),
					})),
				},
			} as CourseSidebarDataType;
		},
	);
}

export function rollbackCoursePlayerProgress(
	queryClient: QueryClient,
	slug: string,
	lessonId: string,
	locale: Locale,
	snapshot: ProgressSnapshot,
) {
	queryClient.setQueryData(queryKeys.dashboard.courseSidebar(slug, locale), snapshot.sidebar);
	queryClient.setQueryData(queryKeys.dashboard.lessonContent(lessonId, locale), snapshot.lesson);
}
