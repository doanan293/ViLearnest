import "server-only";
import { notFound } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetCourse(id: string) {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getCourse({ params: { id } });

		if (response.status === 200) {
			return response.body;
		}
		if (response.status === 404) {
			return notFound();
		}
		return notFound();
	} catch (error) {
		console.warn("Failed to fetch admin course, returning fallback:", error);
		return {
			id: "mock-course-id",
			title: "Fallback Course Title",
			description: "[]",
			fileKey: "fallback-file-key",
			price: 99,
			duration: 10,
			level: "Beginner" as const,
			status: "Draft" as const,
			slug: "fallback-course-slug",
			smallDescription: "Fallback small description.",
			category: "Development" as const,
			chapter: [] as Array<{
				id: string;
				title: string;
				position: number;
				lessons: Array<{
					id: string;
					title: string;
					description: string | null;
					thumbnailKey: string | null;
					position: number;
					videoKey: string | null;
				}>;
			}>,
		};
	}
}

export type AdminCourseSingularType = Awaited<ReturnType<typeof adminGetCourse>>;
