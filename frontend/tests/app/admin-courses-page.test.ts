import { readFileSync } from "node:fs";
import { join } from "node:path";

const adminCoursesPagePath = join(
	process.cwd(),
	"src",
	"app",
	"[locale]",
	"admin",
	"courses",
	"page.tsx",
);

describe("admin courses page", () => {
	it("hydrates fetched courses into the admin course list client section", () => {
		const page = readFileSync(adminCoursesPagePath, "utf8");

		expect(page).toContain('import { QueryClient } from "@tanstack/react-query"');
		expect(page).toContain('import { adminGetCourses } from "@/features/courses"');
		expect(page).toContain("adminCourseListQueryOptions(adminGetCourses)");
		expect(page).toContain("QueryHydrationBoundary");
		expect(page).toContain("<AdminCoursesClientSection />");
		expect(page).not.toContain("courses.map((course)");
		expect(page).not.toContain("prefetchResolved");
	});
});
