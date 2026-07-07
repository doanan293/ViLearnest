import {
	adminCourseDetailQueryOptions,
	adminCourseListQueryOptions,
	adminCourseStructureQueryOptions,
	adminDashboardStatsQueryOptions,
	adminEnrollmentStatsQueryOptions,
	adminLessonQueryOptions,
	adminRecentCoursesQueryOptions,
} from "@/features/courses/hooks/use-admin-course-queries";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

describe("admin course query options", () => {
	it("uses central query keys for admin list and aggregate reads", () => {
		expect(adminCourseListQueryOptions().queryKey).toEqual(queryKeys.admin.courses.list());
		expect(adminRecentCoursesQueryOptions().queryKey).toEqual(queryKeys.admin.courses.recent());
		expect(adminDashboardStatsQueryOptions().queryKey).toEqual(queryKeys.admin.dashboard.stats());
		expect(adminEnrollmentStatsQueryOptions().queryKey).toEqual(
			queryKeys.admin.dashboard.enrollmentStats(),
		);
		expect(adminCourseListQueryOptions().staleTime).toBe(queryStaleTimes.adminList);
		expect(adminRecentCoursesQueryOptions().staleTime).toBe(queryStaleTimes.adminList);
		expect(adminDashboardStatsQueryOptions().staleTime).toBe(queryStaleTimes.dashboard);
		expect(adminEnrollmentStatsQueryOptions().staleTime).toBe(queryStaleTimes.dashboard);
	});

	it("uses parameterized central query keys for admin detail reads", () => {
		expect(adminCourseDetailQueryOptions("course-1").queryKey).toEqual(
			queryKeys.admin.courses.detail("course-1"),
		);
		expect(adminCourseStructureQueryOptions("course-1").queryKey).toEqual(
			queryKeys.admin.courseStructure("course-1"),
		);
		expect(adminLessonQueryOptions("lesson-1").queryKey).toEqual(
			queryKeys.admin.lesson("lesson-1"),
		);
		expect(adminCourseDetailQueryOptions("course-1").staleTime).toBe(queryStaleTimes.adminEdit);
		expect(adminCourseStructureQueryOptions("course-1").staleTime).toBe(queryStaleTimes.adminEdit);
		expect(adminLessonQueryOptions("lesson-1").staleTime).toBe(queryStaleTimes.adminEdit);
	});
});
