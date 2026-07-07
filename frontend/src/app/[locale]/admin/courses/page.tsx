import { QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { adminGetCourses } from "@/features/courses";
import { adminCourseListQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";
import { Link } from "@/i18n/navigation";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { AdminCoursesClientSection } from "./_components/AdminCoursesClientSection";

export default async function AdminCoursesPage() {
	const [t, queryClient] = await Promise.all([
		getTranslations("admin"),
		hydrateQueryClient(new QueryClient(), [adminCourseListQueryOptions(adminGetCourses)]),
	]);

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-3xl font-bold tracking-tight">{t("courseDashboard")}</h1>
				<Link className={buttonVariants()} href="/admin/courses/create">
					{t("createNewCourse")}
				</Link>
			</div>
			<QueryHydrationBoundary queryClient={queryClient}>
				<AdminCoursesClientSection />
			</QueryHydrationBoundary>
		</div>
	);
}
