import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetRecentCourses() {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getRecentCourses();
		if (response.status === 200) {
			return response.body;
		}
		return [];
	} catch (error) {
		console.warn("Failed to fetch recent courses, returning empty array:", error);
		return [];
	}
}

export type RecentCourseType = Awaited<ReturnType<typeof adminGetRecentCourses>>[number];
