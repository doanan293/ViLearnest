import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("public course SEO boundary", () => {
	it("keeps public course list and detail pages as Server Components", () => {
		const listPage = readFileSync(
			join(process.cwd(), "src", "app", "[locale]", "(public)", "courses", "page.tsx"),
			"utf8",
		);
		const detailPage = readFileSync(
			join(process.cwd(), "src", "app", "[locale]", "(public)", "courses", "[slug]", "page.tsx"),
			"utf8",
		);
		const card = readFileSync(
			join(
				process.cwd(),
				"src",
				"app",
				"[locale]",
				"(public)",
				"_components",
				"PublicCourseCard.tsx",
			),
			"utf8",
		);

		expect(listPage.startsWith('"use client"')).toBe(false);
		expect(detailPage.startsWith('"use client"')).toBe(false);
		expect(listPage).not.toContain('"use client"');
		expect(detailPage).not.toContain('"use client"');
		expect(listPage).toContain("getAllCourses()");
		expect(detailPage).toContain("getIndividualCourse");
		expect(listPage).not.toContain("useQuery");
		expect(detailPage).not.toContain("useQuery");
		expect(detailPage).toContain("<EnrollmentCta courseId={course.id} />");
		expect(card.startsWith('"use client"')).toBe(true);
		expect(card).toContain("useEnrollmentStatusIntentPrefetch");
		expect(listPage).not.toContain("useEnrollmentStatusIntentPrefetch");
		expect(detailPage).not.toContain("useEnrollmentStatusIntentPrefetch");
	});

	it("keeps viewer-specific public state out of server render paths", () => {
		const publicLayout = readFileSync(
			join(process.cwd(), "src", "app", "[locale]", "(public)", "layout.tsx"),
			"utf8",
		);
		const detailPage = readFileSync(
			join(process.cwd(), "src", "app", "[locale]", "(public)", "courses", "[slug]", "page.tsx"),
			"utf8",
		);

		expect(publicLayout).not.toContain("getServerApiClient");
		expect(publicLayout).not.toContain("getSession");
		expect(publicLayout).not.toContain("initialSession");
		expect(detailPage).not.toContain("checkIfCourseBought");
		expect(detailPage).not.toContain("enrollmentStatusQueryOptions");
		expect(detailPage).not.toContain("QueryHydrationBoundary");
		expect(detailPage).not.toContain("hydrateQueryClient");
	});
});
