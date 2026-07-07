import { type QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import type { CourseSidebarDataType, LessonContentType } from "@/features/courses";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

type QueryFn<T> = () => Promise<T>;

type ProgressSnapshot = {
	sidebar: CourseSidebarDataType | undefined;
	lesson: LessonContentType | undefined;
};

export function courseSidebarQueryOptions(
	slug: string,
	queryFn: QueryFn<CourseSidebarDataType> = () => api.courses.getSidebarData(slug),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.courseSidebar(slug),
		queryFn,
		staleTime: queryStaleTimes.coursePlayer,
	});
}

export function lessonContentQueryOptions(
	lessonId: string,
	queryFn: QueryFn<LessonContentType> = () => api.courses.getLessonContent(lessonId),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.lessonContent(lessonId),
		queryFn,
		staleTime: queryStaleTimes.coursePlayer,
	});
}

export function useCourseSidebarQuery(slug: string) {
	return useQuery(courseSidebarQueryOptions(slug));
}

export function useLessonContentQuery(lessonId: string) {
	return useQuery(lessonContentQueryOptions(lessonId));
}

export function enrollmentStatusQueryOptions(
	courseId: string,
	queryFn: QueryFn<boolean> = async () => {
		const response = await api.courses.isEnrolled(courseId);
		return response.enrolled;
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

export function markLessonContentCompleted(queryClient: QueryClient, lessonId: string) {
	queryClient.setQueryData<LessonContentType>(
		queryKeys.dashboard.lessonContent(lessonId),
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
) {
	queryClient.setQueryData<CourseSidebarDataType>(
		queryKeys.dashboard.courseSidebar(slug),
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
	snapshot: ProgressSnapshot,
) {
	queryClient.setQueryData(queryKeys.dashboard.courseSidebar(slug), snapshot.sidebar);
	queryClient.setQueryData(queryKeys.dashboard.lessonContent(lessonId), snapshot.lesson);
}
