import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetDashboardStats() {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getDashboardStats();
		if (response.status === 200) {
			return response.body;
		}
		return {
			totalSignups: 0,
			totalCustomers: 0,
			totalCourses: 0,
			totalLessons: 0,
		};
	} catch (error) {
		console.warn("Failed to fetch dashboard stats, returning 0 values:", error);
		return {
			totalSignups: 0,
			totalCustomers: 0,
			totalCourses: 0,
			totalLessons: 0,
		};
	}
}
