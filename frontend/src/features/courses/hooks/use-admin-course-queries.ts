import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

type QueryFn<T> = () => Promise<T>;

export function adminCourseListQueryOptions(queryFn = api.admin.getCourses) {
	return queryOptions({
		queryKey: queryKeys.admin.courses.list(),
		queryFn,
		staleTime: queryStaleTimes.adminList,
	});
}

export function adminRecentCoursesQueryOptions(queryFn = api.admin.getRecentCourses) {
	return queryOptions({
		queryKey: queryKeys.admin.courses.recent(),
		queryFn,
		staleTime: queryStaleTimes.adminList,
	});
}

export function adminDashboardStatsQueryOptions(queryFn = api.admin.getDashboardStats) {
	return queryOptions({
		queryKey: queryKeys.admin.dashboard.stats(),
		queryFn,
		staleTime: queryStaleTimes.dashboard,
	});
}

export function adminEnrollmentStatsQueryOptions(queryFn = api.admin.getEnrollmentStats) {
	return queryOptions({
		queryKey: queryKeys.admin.dashboard.enrollmentStats(),
		queryFn,
		staleTime: queryStaleTimes.dashboard,
	});
}

export function adminCourseDetailQueryOptions(
	courseId: string,
	queryFn: QueryFn<Awaited<ReturnType<typeof api.admin.getCourse>>> = () =>
		api.admin.getCourse(courseId),
) {
	return queryOptions({
		queryKey: queryKeys.admin.courses.detail(courseId),
		queryFn,
		staleTime: queryStaleTimes.adminEdit,
	});
}

export function adminCourseStructureQueryOptions(
	courseId: string,
	queryFn: QueryFn<Awaited<ReturnType<typeof api.admin.getCourse>>> = () =>
		api.admin.getCourse(courseId),
) {
	return queryOptions({
		queryKey: queryKeys.admin.courseStructure(courseId),
		queryFn,
		staleTime: queryStaleTimes.adminEdit,
	});
}

export function adminLessonQueryOptions(
	lessonId: string,
	queryFn: QueryFn<Awaited<ReturnType<typeof api.admin.getLesson>>> = () =>
		api.admin.getLesson(lessonId),
) {
	return queryOptions({
		queryKey: queryKeys.admin.lesson(lessonId),
		queryFn,
		staleTime: queryStaleTimes.adminEdit,
	});
}
