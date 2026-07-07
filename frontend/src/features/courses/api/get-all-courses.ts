import { getServerApiClient } from "@/lib/server-api-client";

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[number];

export async function getAllCourses() {
	try {
		const serverApi = await getServerApiClient();
		const response = await serverApi.courses.getAllCourses();
		if (response.status === 200) {
			return response.body;
		}
		return [];
	} catch (error) {
		console.error("Failed to fetch courses from Fastify:", error);
		return [];
	}
}
