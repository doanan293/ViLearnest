import { QueryClient } from "@tanstack/react-query";
import { enrolledCoursesQueryOptions } from "@/features/courses/hooks/use-dashboard-courses-query";
import { getEnrolledCourses } from "@/features/users";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { EnrolledCoursesClientSection } from "./EnrolledCoursesClientSection";

export async function EnrolledCoursesSection() {
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		enrolledCoursesQueryOptions(getEnrolledCourses),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<EnrolledCoursesClientSection />
		</QueryHydrationBoundary>
	);
}
