import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import type { CourseSidebarDataType } from "@/features/courses/api/get-course-sidebar-data";
import { CourseSidebar } from "@/features/courses/components/CourseSidebar";
import { markSidebarLessonCompleted } from "@/features/courses/hooks/use-course-player-query";
import { queryKeys } from "@/lib/query-keys";

jest.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({
		children,
		className,
		href,
	}: {
		children: React.ReactNode;
		className?: string;
		href: string;
	}) => (
		<a className={className} href={href}>
			{children}
		</a>
	),
	usePathname: () => "/en/dashboard/ai-fast/lesson-1",
}));

function createCourse(): CourseSidebarDataType["course"] {
	return {
		id: "course-1",
		title: "AI Fast",
		description: "Course description",
		fileKey: "course-thumbnail",
		price: 0,
		duration: 10,
		level: "Beginner",
		category: "Development",
		smallDescription: "Short course description",
		slug: "ai-fast",
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
						lessonProgess: [],
					},
					{
						id: "lesson-2",
						title: "Lesson 2",
						position: 2,
						description: null,
						lessonProgess: [],
					},
				],
			},
		],
	};
}

function CompleteLessonButton() {
	const queryClient = useQueryClient();

	return (
		<button
			type="button"
			onClick={() => markSidebarLessonCompleted(queryClient, "ai-fast", "lesson-1")}
		>
			Complete lesson one
		</button>
	);
}

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

describe("CourseSidebar progress cache", () => {
	it("updates progress immediately when query cache marks a lesson complete", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.dashboard.courseSidebar("ai-fast"), {
			course: createCourse(),
		});

		render(
			<QueryClientProvider client={queryClient}>
				<CourseSidebar slug="ai-fast" />
				<CompleteLessonButton />
			</QueryClientProvider>,
		);

		expect(screen.getByText("0/2 lessons")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Complete lesson one" }));

		await waitFor(() => expect(screen.getByText("1/2 lessons")).toBeInTheDocument());
		expect(screen.getByText("50% complete")).toBeInTheDocument();
		expect(screen.getByText("completed")).toBeInTheDocument();
	});
});
