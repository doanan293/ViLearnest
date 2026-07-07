import { QueryClient } from "@tanstack/react-query";
import { adminGetCourse } from "@/features/courses";
import {
	adminCourseDetailQueryOptions,
	adminCourseStructureQueryOptions,
} from "@/features/courses/hooks/use-admin-course-queries";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { EditCourseClient } from "./_components/EditCourseClient";

type Params = Promise<{ courseId: string }>;

export default async function EditRoute({ params }: { params: Params }) {
	const { courseId } = await params;
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		adminCourseDetailQueryOptions(courseId, () => adminGetCourse(courseId)),
		adminCourseStructureQueryOptions(courseId, () => adminGetCourse(courseId)),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<EditCourseClient courseId={courseId} />
		</QueryHydrationBoundary>
	);
}
