import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PublicCourseType } from "@/features/courses/api/get-all-courses";
import type { EnrolledCourseType } from "@/features/users";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

type QueryFn<T> = () => Promise<T>;

export function enrolledCoursesQueryOptions(
	queryFn: QueryFn<Awaited<ReturnType<typeof api.courses.getEnrolledCourses>>> = () =>
		api.courses.getEnrolledCourses(),
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.enrolledCourses(),
		queryFn,
		staleTime: queryStaleTimes.dashboard,
	});
}

export function availableCoursesQueryOptions(
	queryFn: QueryFn<Array<PublicCourseType>> = async () => {
		const [courses, enrolledCourses] = await Promise.all([
			api.courses.getAllCourses(),
			api.courses.getEnrolledCourses(),
		]);

		return courses.filter(
			(course: PublicCourseType) =>
				!enrolledCourses.some(({ Course }: EnrolledCourseType) => Course.id === course.id),
		);
	},
) {
	return queryOptions({
		queryKey: queryKeys.dashboard.availableCourses(),
		queryFn,
		staleTime: queryStaleTimes.catalog,
	});
}

export function useEnrolledCoursesQuery() {
	return useQuery(enrolledCoursesQueryOptions());
}

export function useAvailableCoursesQuery() {
	return useQuery(availableCoursesQueryOptions());
}
