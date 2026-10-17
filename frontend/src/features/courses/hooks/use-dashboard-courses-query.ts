import { queryOptions, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { PublicCourseType } from "@/features/courses/api/get-all-courses";
import type { EnrolledCourseType } from "@/features/users";
import type { Locale } from "@/i18n/pathname";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

type QueryFn<T> = () => Promise<T>;

export function enrolledCoursesQueryOptions(
	locale: Locale,
	queryFn: QueryFn<Awaited<ReturnType<typeof api.courses.getEnrolledCourses>>> = () =>
		api.courses.getEnrolledCourses(locale),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.enrolledCourses(locale),
		queryFn,
		staleTime: queryStaleTimes.dashboard,
	});
}

export function availableCoursesQueryOptions(
	locale: Locale,
	queryFn: QueryFn<Array<PublicCourseType>> = async () => {
		const [courses, enrolledCourses] = await Promise.all([
			api.courses.getAllCourses(locale),
			api.courses.getEnrolledCourses(locale),
		]);

		return courses.filter(
			(course: PublicCourseType) =>
				!enrolledCourses.some(({ Course }: EnrolledCourseType) => Course.id === course.id),
		);
	},
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.availableCourses(locale),
		queryFn,
		staleTime: queryStaleTimes.catalog,
	});
}

export function useEnrolledCoursesQuery() {
	const locale = useLocale() as Locale;
	return useQuery(enrolledCoursesQueryOptions(locale));
}

export function useAvailableCoursesQuery() {
	const locale = useLocale() as Locale;
	return useQuery(availableCoursesQueryOptions(locale));
}
