import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetEnrollmentStats() {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getEnrollmentStats();
		if (response.status === 200) {
			return response.body;
		}
		return buildFallbackDays();
	} catch (error) {
		console.warn("Failed to fetch enrollment stats, returning fallback days array:", error);
		return buildFallbackDays();
	}
}

function buildFallbackDays(): Array<{ date: string; enrollments: number }> {
	const days: Array<{ date: string; enrollments: number }> = [];
	for (let i = 29; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		days.push({ date: date.toISOString().split("T")[0], enrollments: 0 });
	}
	return days;
}
