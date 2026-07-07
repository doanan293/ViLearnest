import { notFound } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function getCourseSidebarData(slug: string) {
	try {
		const api = await getServerApiClient();
		const response = await api.courses.getSidebarData({ params: { slug } });

		if (response.status === 200) {
			return response.body;
		}
		if (response.status === 404) {
			return notFound();
		}
		if (response.status === 401 || response.status === 403) {
			return notFound();
		}
		return notFound();
	} catch (error) {
		console.warn("Failed to fetch sidebar data, returning fallback:", error);
		return {
			course: {
				id: "mock-id",
				title: "Fallback Title",
				fileKey: "fallback-file-key",
				duration: 10,
				level: "Beginner" as const,
				category: "Development" as const,
				slug,
				chapter: [] as Array<{
					id: string;
					title: string;
					position: number;
					lessons: Array<{
						id: string;
						title: string;
						position: number;
						description: string | null;
						lessonProgess: Array<{
							id: string;
							completed: boolean;
							lessonId: string;
						}>;
					}>;
				}>,
			},
		};
	}
}

export type CourseSidebarDataType = Awaited<ReturnType<typeof getCourseSidebarData>>;
