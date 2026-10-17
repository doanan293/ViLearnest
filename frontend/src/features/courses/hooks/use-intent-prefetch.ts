"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import type { Locale } from "@/i18n/pathname";
import { adminCourseDetailQueryOptions } from "./use-admin-course-queries";
import {
	courseSidebarQueryOptions,
	enrollmentStatusQueryOptions,
	lessonContentQueryOptions,
} from "./use-course-player-query";

export function useEnrollmentStatusIntentPrefetch(courseId: string) {
	const queryClient = useQueryClient();
	return useCallback(
		() => queryClient.prefetchQuery(enrollmentStatusQueryOptions(courseId)),
		[courseId, queryClient],
	);
}

export function useCourseSidebarIntentPrefetch(slug: string) {
	const queryClient = useQueryClient();
	const locale = useLocale() as Locale;
	return useCallback(
		() => queryClient.prefetchQuery(courseSidebarQueryOptions(slug, locale)),
		[locale, queryClient, slug],
	);
}

export function useLessonContentIntentPrefetch(lessonId: string) {
	const queryClient = useQueryClient();
	const locale = useLocale() as Locale;
	return useCallback(
		() => queryClient.prefetchQuery(lessonContentQueryOptions(lessonId, locale)),
		[lessonId, locale, queryClient],
	);
}

export function useAdminCourseIntentPrefetch(courseId: string) {
	const queryClient = useQueryClient();
	return useCallback(
		() => queryClient.prefetchQuery(adminCourseDetailQueryOptions(courseId)),
		[courseId, queryClient],
	);
}
