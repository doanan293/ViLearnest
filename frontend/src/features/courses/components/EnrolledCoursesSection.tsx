import { QueryClient } from "@tanstack/react-query";
import { getLocale } from "next-intl/server";
import { enrolledCoursesQueryOptions } from "@/features/courses/hooks/use-dashboard-courses-query";
import { getEnrolledCourses } from "@/features/users";
import type { Locale } from "@/i18n/pathname";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { EnrolledCoursesClientSection } from "./EnrolledCoursesClientSection";

export async function EnrolledCoursesSection() {
	const locale = (await getLocale()) as Locale;
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		enrolledCoursesQueryOptions(locale, getEnrolledCourses),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<EnrolledCoursesClientSection />
		</QueryHydrationBoundary>
	);
}
