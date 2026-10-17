import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	useAdminCourseIntentPrefetch,
	useCourseSidebarIntentPrefetch,
	useEnrollmentStatusIntentPrefetch,
	useLessonContentIntentPrefetch,
} from "@/features/courses/hooks/use-intent-prefetch";
import { queryKeys } from "@/lib/query-keys";

jest.mock("next-intl", () => ({
	useLocale: () => "en",
}));

function wrapper(client: QueryClient) {
	return function QueryWrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
	};
}

describe("intent prefetch hooks", () => {
	it("prefetches enrollment status once a public course intent is clear", async () => {
		const client = new QueryClient();
		const prefetchQuery = jest.spyOn(client, "prefetchQuery").mockResolvedValue();
		const { result } = renderHook(() => useEnrollmentStatusIntentPrefetch("course-1"), {
			wrapper: wrapper(client),
		});

		await result.current();

		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: queryKeys.courses.enrollmentStatus("course-1") }),
		);
	});

	it("prefetches learner and admin navigation data", async () => {
		const client = new QueryClient();
		const prefetchQuery = jest.spyOn(client, "prefetchQuery").mockResolvedValue();

		const sidebar = renderHook(() => useCourseSidebarIntentPrefetch("react-course"), {
			wrapper: wrapper(client),
		});
		const lesson = renderHook(() => useLessonContentIntentPrefetch("lesson-1"), {
			wrapper: wrapper(client),
		});
		const admin = renderHook(() => useAdminCourseIntentPrefetch("course-1"), {
			wrapper: wrapper(client),
		});

		await sidebar.result.current();
		await lesson.result.current();
		await admin.result.current();

		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: queryKeys.dashboard.courseSidebar("react-course", "en"),
			}),
		);
		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: queryKeys.dashboard.lessonContent("lesson-1", "en") }),
		);
		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: queryKeys.admin.courses.detail("course-1") }),
		);
	});
});
