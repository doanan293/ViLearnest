import { notFound } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function getIndividualCourse(slug: string) {
	try {
		const api = await getServerApiClient();
		const response = await api.courses.getBySlug({ params: { slug } });
		if (response.status === 200) {
			return response.body;
		}
		if (response.status === 404) {
			return notFound();
		}
		return notFound();
	} catch (error) {
		console.warn("Failed to fetch course, returning fallback:", error);
		return {
			id: "mock-id",
			title: "Fallback Course Title",
			description: JSON.stringify([
				{
					type: "paragraph",
					children: [{ text: "Offline fallback description." }],
				},
			]),
			fileKey: "fallback-file-key",
			price: 99,
			duration: 10,
			level: "Beginner" as const,
			category: "Development" as const,
			smallDescription: "Offline fallback small description.",
			slug,
			chapter: [] as Array<{
				id: string;
				title: string;
				lessons: Array<{ id: string; title: string }>;
			}>,
		};
	}
}

export type IndividualCourseType = Awaited<ReturnType<typeof getIndividualCourse>>;
