import { readFileSync } from "node:fs";
import { join } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { AvailableCoursesClientSection } from "@/features/courses/components/AvailableCoursesClientSection";
import { EnrolledCoursesClientSection } from "@/features/courses/components/EnrolledCoursesClientSection";
import {
	availableCoursesQueryOptions,
	enrolledCoursesQueryOptions,
} from "@/features/courses/hooks/use-dashboard-courses-query";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

jest.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string, values?: Record<string, number>) => {
		if (values) return `${key}:${Object.values(values).join("/")}`;
		return key;
	},
}));

jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ alt }: { alt?: string }) => <span aria-label={alt} role="img" />,
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({ children, href, ...props }: { children: ReactElement | string; href: string }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

jest.mock("@/hooks/use-construct-url", () => ({
	useConstructUrl: (key: string) => `https://assets.test/${key}`,
}));

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: Number.POSITIVE_INFINITY,
			},
		},
	});
}

function renderWithClient(ui: ReactElement, queryClient: QueryClient) {
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("dashboard course cache hooks", () => {
	it("defines enrolled and available dashboard query hooks", () => {
		const source = readFileSync(
			join(process.cwd(), "src", "features", "courses", "hooks", "use-dashboard-courses-query.ts"),
			"utf8",
		);

		expect(source).toContain("useEnrolledCoursesQuery");
		expect(source).toContain("queryKeys.dashboard.enrolledCourses(locale)");
		expect(source).toContain("useAvailableCoursesQuery");
		expect(source).toContain("queryKeys.dashboard.availableCourses(locale)");
	});

	it("assigns stale-time policies to dashboard course queries", () => {
		expect(enrolledCoursesQueryOptions("en").staleTime).toBe(queryStaleTimes.dashboard);
		expect(availableCoursesQueryOptions("en").staleTime).toBe(queryStaleTimes.catalog);
	});

	it("renders enrolled courses from hydrated cache without a loading-only state", () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.dashboard.enrolledCourses("en"), [
			{
				Course: {
					id: "course-1",
					title: "Hydrated Course",
					slug: "hydrated-course",
					smallDescription: "Ready from cache",
					fileKey: "course.jpg",
					duration: 10,
					level: "Beginner",
					category: "Development",
					chapter: [
						{
							id: "chapter-1",
							title: "Chapter 1",
							position: 1,
							lessons: [
								{
									id: "lesson-1",
									title: "Lesson 1",
									position: 1,
									description: null,
									lessonProgess: [{ lessonId: "lesson-1", completed: true }],
								},
								{
									id: "lesson-2",
									title: "Lesson 2",
									position: 2,
									description: null,
									lessonProgess: [{ lessonId: "lesson-2", completed: false }],
								},
							],
						},
					],
				},
			},
		]);

		renderWithClient(<EnrolledCoursesClientSection />, queryClient);

		expect(screen.getByText("Hydrated Course")).toBeInTheDocument();
		expect(screen.queryByText("noCoursesPurchasedTitle")).not.toBeInTheDocument();
	});

	it("renders available courses from hydrated cache without a loading-only state", () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.dashboard.availableCourses("en"), [
			{
				id: "course-2",
				title: "Available Hydrated Course",
				slug: "available-hydrated-course",
				smallDescription: "Available from cache",
				fileKey: "course.jpg",
				price: 100,
				duration: 10,
				level: "Beginner",
				category: "Development",
				chapter: [],
			},
		]);

		renderWithClient(<AvailableCoursesClientSection />, queryClient);

		expect(screen.getByText("Available Hydrated Course")).toBeInTheDocument();
		expect(screen.queryByText("noCoursesAvailableTitle")).not.toBeInTheDocument();
	});
});
