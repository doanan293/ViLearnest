import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CourseSidebarDataType, LessonContentType } from "@/features/courses";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
	markLessonContentCompleted,
	markSidebarLessonCompleted,
	rollbackCoursePlayerProgress,
} from "./use-course-player-query";

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

	return useMutation({
		mutationFn: (courseId: string) => api.courses.enroll(courseId),
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

	return useMutation({
		mutationFn: ({ lessonId, slug }: { lessonId: string; slug: string }) =>
			api.courses.markComplete(lessonId, slug),
		onMutate: async ({ lessonId, slug }) => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: queryKeys.dashboard.courseSidebar(slug) }),
				queryClient.cancelQueries({ queryKey: queryKeys.dashboard.lessonContent(lessonId) }),
			]);

			const snapshot = {
				sidebar: queryClient.getQueryData<CourseSidebarDataType>(
					queryKeys.dashboard.courseSidebar(slug),
				),
				lesson: queryClient.getQueryData<LessonContentType>(
					queryKeys.dashboard.lessonContent(lessonId),
				),
			};

			markLessonContentCompleted(queryClient, lessonId);
			markSidebarLessonCompleted(queryClient, slug, lessonId);

			return snapshot;
		},
		onError: (_error, { lessonId, slug }, snapshot) => {
			if (snapshot) {
				rollbackCoursePlayerProgress(queryClient, slug, lessonId, snapshot);
			}
		},
		onSuccess: (_result, { lessonId, slug }) => {
			markLessonContentCompleted(queryClient, lessonId);
			markSidebarLessonCompleted(queryClient, slug, lessonId);
		},
		onSettled: (_result, _error, { lessonId, slug }) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.courseSidebar(slug) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lessonContent(lessonId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.enrolledCourses() });
		},
	});
}
