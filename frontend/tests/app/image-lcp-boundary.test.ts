import { readFileSync } from "node:fs";
import { join } from "node:path";

const cardImageSizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw";
const detailCoverSizes = "(max-width: 1024px) 100vw, 66vw";

function readSource(pathFromSrc: string) {
	return readFileSync(join(process.cwd(), "src", ...pathFromSrc.split("/")), "utf8");
}

describe("image LCP boundaries", () => {
	it("sets responsive sizes on course card images", () => {
		const publicCard = readSource("app/[locale]/(public)/_components/PublicCourseCard.tsx");
		const dashboardCard = readSource("features/courses/components/CourseProgressCard.tsx");
		const adminCard = readSource("app/[locale]/admin/courses/_components/AdminCourseCard.tsx");

		expect(publicCard).toContain(`sizes="${cardImageSizes}"`);
		expect(dashboardCard).toContain(`sizes="${cardImageSizes}"`);
		expect(adminCard).toContain(`sizes="${cardImageSizes}"`);
	});

	it("keeps the course detail cover prioritized with responsive sizes", () => {
		const detailPage = readSource("app/[locale]/(public)/courses/[slug]/page.tsx");

		expect(detailPage).toContain(`sizes="${detailCoverSizes}"`);
		expect(detailPage).toContain("priority");
	});
});
