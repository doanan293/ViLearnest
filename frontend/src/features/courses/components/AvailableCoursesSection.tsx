import { QueryClient } from "@tanstack/react-query";
import { getLocale } from "next-intl/server";
import { availableCoursesQueryOptions } from "@/features/courses/hooks/use-dashboard-courses-query";
import { getEnrolledCourses } from "@/features/users";
import type { Locale } from "@/i18n/pathname";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { getAllCourses } from "../api/get-all-courses";
import { AvailableCoursesClientSection } from "./AvailableCoursesClientSection";

export async function AvailableCoursesSection() {
	const locale = (await getLocale()) as Locale;
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		availableCoursesQueryOptions(locale, async () => {
			const [courses, enrolledCourses] = await Promise.all([getAllCourses(), getEnrolledCourses()]);
			return courses.filter(
				(course) => !enrolledCourses.some(({ Course: enrolled }) => enrolled.id === course.id),
			);
		}),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<AvailableCoursesClientSection />
		</QueryHydrationBoundary>
	);
}
