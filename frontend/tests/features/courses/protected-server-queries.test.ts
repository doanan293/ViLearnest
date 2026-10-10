import { getCourseSidebarData } from "@/features/courses/api/get-course-sidebar-data";
import { getLessonContent } from "@/features/courses/api/get-lesson-content";
import { getServerApiClient } from "@/lib/server-api-client";

const missing = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
	notFound: () => {
		throw missing;
	},
}));
jest.mock("@/lib/server-api-client", () => ({ getServerApiClient: jest.fn() }));

describe("protected server queries", () => {
	it.each([401, 403, 404])("preserves refusal control flow for status %s", async (status) => {
		jest.mocked(getServerApiClient).mockResolvedValue({
			courses: {
				getSidebarData: async () => ({ status, body: null }),
				getLessonContent: async () => ({ status, body: null }),
			},
		} as unknown as Awaited<ReturnType<typeof getServerApiClient>>);
		await expect(getCourseSidebarData("protected")).rejects.toBe(missing);
		await expect(getLessonContent("protected")).rejects.toBe(missing);
	});
	it("propagates network failures without fabricating protected content", async () => {
		const failure = new Error("network unavailable");
		jest.mocked(getServerApiClient).mockRejectedValue(failure);
		await expect(getCourseSidebarData("protected")).rejects.toBe(failure);
		await expect(getLessonContent("protected")).rejects.toBe(failure);
	});
});
