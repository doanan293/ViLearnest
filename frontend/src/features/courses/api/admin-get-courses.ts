import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetCourses() {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getCourses();
		if (response.status === 200) {
			return response.body;
		}
		return [];
	} catch (error) {
		console.warn("Failed to fetch admin courses, returning empty array:", error);
		return [];
	}
}

export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[number];
