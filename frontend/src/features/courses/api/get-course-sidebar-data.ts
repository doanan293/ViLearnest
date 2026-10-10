import { notFound } from "next/navigation";
import { ApiClientError } from "@/lib/api-client";
import { getServerApiClient } from "@/lib/server-api-client";

export async function getCourseSidebarData(slug: string) {
	const api = await getServerApiClient();
	const response = await api.courses.getSidebarData({ params: { slug } });
	if (response.status === 200) return response.body;
	if ([401, 403, 404].includes(response.status)) return notFound();
	throw new ApiClientError(
		"Unable to load protected course content",
		response.status,
		"REQUEST_ERROR",
	);
}

export type CourseSidebarDataType = Awaited<ReturnType<typeof getCourseSidebarData>>;
