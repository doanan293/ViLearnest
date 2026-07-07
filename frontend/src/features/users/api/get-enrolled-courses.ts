import { getServerApiClient } from "@/lib/server-api-client";

export async function getEnrolledCourses() {
	try {
		const api = await getServerApiClient();
		const response = await api.courses.getEnrolledCourses();
		if (response.status === 200) {
			return response.body;
		}
		return [];
	} catch (error) {
		console.warn("Failed to fetch enrolled courses:", error);
		return [];
	}
}

export type EnrolledCourseType = Awaited<ReturnType<typeof getEnrolledCourses>>[number];
