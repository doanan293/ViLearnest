import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { CourseSidebarDataType, LessonContentType } from "@/features/courses";
import type { Locale } from "@/i18n/pathname";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
	markLessonContentCompleted,
	markSidebarLessonCompleted,
	rollbackCoursePlayerProgress,
} from "./use-course-player-query";

// Invalidation uses locale-free key prefixes so both languages refetch after a write.

export function useConfirmCheckoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (sessionId: string) => api.courses.confirmCheckout(sessionId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.enrolledCourses() });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.availableCourses() });
		},
	});
}

export function useEnrollCourseMutation() {
	const queryClient = useQueryClient();
	const locale = useLocale() as Locale;

	return useMutation({
		mutationFn: (courseId: string) => api.courses.enroll(courseId, locale),
		onSuccess: (result, courseId) => {
			if (result.status === "success" && !result.checkoutUrl) {
				queryClient.setQueryData(queryKeys.courses.enrollmentStatus(courseId), true);
			}
			void queryClient.invalidateQueries({
				queryKey: queryKeys.courses.enrollmentStatus(courseId),
			});
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.enrolledCourses() });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.availableCourses() });
		},
	});
}

export function useMarkLessonCompleteMutation() {
	const queryClient = useQueryClient();
	const locale = useLocale() as Locale;

	return useMutation({
		mutationFn: ({ lessonId, slug }: { lessonId: string; slug: string }) =>
			api.courses.markComplete(lessonId, slug),
		onMutate: async ({ lessonId, slug }) => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: queryKeys.dashboard.courseSidebar(slug, locale) }),
				queryClient.cancelQueries({
					queryKey: queryKeys.dashboard.lessonContent(lessonId, locale),
				}),
			]);

			const snapshot = {
				sidebar: queryClient.getQueryData<CourseSidebarDataType>(
					queryKeys.dashboard.courseSidebar(slug, locale),
				),
				lesson: queryClient.getQueryData<LessonContentType>(
					queryKeys.dashboard.lessonContent(lessonId, locale),
				),
			};

			markLessonContentCompleted(queryClient, lessonId, locale);
			markSidebarLessonCompleted(queryClient, slug, lessonId, locale);

			return snapshot;
		},
		onError: (_error, { lessonId, slug }, snapshot) => {
			if (snapshot) {
				rollbackCoursePlayerProgress(queryClient, slug, lessonId, locale, snapshot);
			}
		},
		onSuccess: (_result, { lessonId, slug }) => {
			markLessonContentCompleted(queryClient, lessonId, locale);
			markSidebarLessonCompleted(queryClient, slug, lessonId, locale);
		},
		onSettled: (_result, _error, { lessonId, slug }) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.courseSidebar(slug) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lessonContent(lessonId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.enrolledCourses() });
		},
	});
}
