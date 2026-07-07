import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("course player query hydration boundaries", () => {
	it("hydrates course sidebar data in the dashboard course layout", () => {
		const source = readFileSync(join(root, "src/app/[locale]/dashboard/[slug]/layout.tsx"), "utf8");
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("courseSidebarQueryOptions");
		expect(source).toContain("getCourseSidebarData");
		expect(source).toContain("<CourseSidebar slug={slug} />");
	});

	it("hydrates lesson content in the lesson page", () => {
		const source = readFileSync(
			join(root, "src/app/[locale]/dashboard/[slug]/[lessonId]/page.tsx"),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("lessonContentQueryOptions");
		expect(source).toContain("<CourseContent lessonId={lessonId} />");
	});
});
