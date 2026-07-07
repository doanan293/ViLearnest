import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();

describe("admin private read hydration boundaries", () => {
	it("hydrates the admin dashboard page around query-backed sections", () => {
		const source = readFileSync(join(projectRoot, "src/app/[locale]/admin/page.tsx"), "utf8");
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminDashboardStatsQueryOptions");
		expect(source).toContain("adminRecentCoursesQueryOptions");
		expect(source).toContain("adminEnrollmentStatsQueryOptions");
	});

	it("hydrates the admin course list page around query-backed sections", () => {
		const source = readFileSync(
			join(projectRoot, "src/app/[locale]/admin/courses/page.tsx"),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminCourseListQueryOptions");
	});

	it("hydrates the admin course edit page around query-backed sections", () => {
		const source = readFileSync(
			join(projectRoot, "src/app/[locale]/admin/courses/[courseId]/edit/page.tsx"),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminCourseDetailQueryOptions");
		expect(source).toContain("adminCourseStructureQueryOptions");
	});

	it("hydrates the admin lesson edit page around query-backed lesson data", () => {
		const source = readFileSync(
			join(
				projectRoot,
				"src/app/[locale]/admin/courses/[courseId]/[chapterId]/[lessonId]/page.tsx",
			),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminLessonQueryOptions");
	});
});
