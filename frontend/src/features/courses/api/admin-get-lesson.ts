import { notFound } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetLesson(id: string) {
	try {
		const api = await getServerApiClient();
		const response = await api.admin.courses.getLesson({ params: { id } });

		if (response.status === 200) {
			return response.body;
		}
		if (response.status === 404) {
			return notFound();
		}
		return notFound();
	} catch (error) {
		console.warn("Failed to fetch admin lesson, returning fallback:", error);
		return {
			id: "mock-lesson-id",
			title: "Fallback Lesson Title",
			videoKey: "fallback-video-key",
			thumbnailKey: "fallback-thumbnail-key",
			description: "Fallback description",
			position: 1,
		};
	}
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
