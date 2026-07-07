import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const routeDirs = [
	["[locale]", "(public)", "courses"],
	["[locale]", "(public)", "courses", "[slug]"],
	["[locale]", "dashboard"],
	["[locale]", "dashboard", "[slug]", "[lessonId]"],
	["[locale]", "dashboard", "settings", "profile"],
	["[locale]", "admin"],
	["[locale]", "admin", "courses"],
	["[locale]", "admin", "courses", "[courseId]", "edit"],
	["[locale]", "admin", "users"],
	["[locale]", "admin", "users", "[userId]", "profile"],
];

const pagesWithRouteLoading = [
	["[locale]", "(public)", "courses", "page.tsx"],
	["[locale]", "dashboard", "page.tsx"],
	["[locale]", "dashboard", "[slug]", "[lessonId]", "page.tsx"],
];

describe("route loading and error polish", () => {
	it("adds loading and error files to important route groups", () => {
		for (const parts of routeDirs) {
			const dir = join(process.cwd(), "src", "app", ...parts);
			expect(existsSync(join(dir, "loading.tsx"))).toBe(true);
			expect(existsSync(join(dir, "error.tsx"))).toBe(true);
		}
	});

	it("keeps error routes thin and delegated to RouteErrorState", () => {
		for (const parts of routeDirs) {
			const source = readFileSync(join(process.cwd(), "src", "app", ...parts, "error.tsx"), "utf8");
			expect(source.startsWith('"use client"')).toBe(true);
			expect(source).toContain("RouteErrorState");
			expect(source).toContain("reset={reset}");
		}
	});

	it("moves route-level skeleton fallbacks out of page components", () => {
		for (const parts of pagesWithRouteLoading) {
			const source = readFileSync(join(process.cwd(), "src", "app", ...parts), "utf8");
			expect(source).not.toContain("Suspense fallback");
			expect(source).not.toContain("LoadingSkeletonLayout");
		}
	});
});
