import "server-only";
import { notFound } from "next/navigation";
import { type AdminCourseResponse, getServerApiClient } from "@/lib/server-api-client";

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
		const fallback: AdminCourseResponse = {
			id: "mock-course-id",
			title: "Fallback Course Title",
			titleEn: "Fallback Course Title",
			titleVi: null,
			descriptionEn: null,
			descriptionVi: null,
			fileKey: "fallback-file-key",
			price: 99,
			duration: 10,
			level: "Beginner",
			status: "Draft",
			slug: "fallback-course-slug",
			smallDescriptionEn: "Fallback small description.",
			smallDescriptionVi: null,
			category: "Development",
			chapter: [],
		};
		return fallback;
	}
}

export type AdminCourseSingularType = Awaited<ReturnType<typeof adminGetCourse>>;
