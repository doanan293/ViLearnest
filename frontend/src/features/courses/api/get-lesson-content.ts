import "server-only";
import { notFound } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function getLessonContent(lessonId: string) {
	try {
		const api = await getServerApiClient();
		const response = await api.courses.getLessonContent({
			params: { lessonId },
		});

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
		console.warn("Failed to fetch lesson content, returning fallback:", error);
		return {
			id: lessonId,
			title: "Fallback Lesson",
			description: "Fallback description",
			thumbnailKey: "fallback-thumbnail",
			videoKey: "fallback-video",
			position: 1,
			lessonProgess: [] as Array<{ completed: boolean; lessonId: string }>,
			Chapter: {
				courseId: "mock-course-id",
				Course: { slug: "fallback-slug" },
			},
		};
	}
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
