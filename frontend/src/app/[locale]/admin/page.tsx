import { QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { adminGetDashboardStats } from "@/app/data/admin/admin-get-dashboard-stats";
import { adminGetEnrollmentStats } from "@/app/data/admin/admin-get-enrollment-stats";
import { buttonVariants } from "@/components/ui/button";
import { adminGetRecentCourses } from "@/features/courses";
import {
	adminDashboardStatsQueryOptions,
	adminEnrollmentStatsQueryOptions,
	adminRecentCoursesQueryOptions,
} from "@/features/courses/hooks/use-admin-course-queries";
import { Link } from "@/i18n/navigation";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { AdminEnrollmentChartSection } from "./_components/AdminEnrollmentChartSection";
import { AdminRecentCoursesSection } from "./_components/AdminRecentCoursesSection";
import { AdminSectionCards } from "./_components/AdminSectionCards";

export default async function AdminIndexPage() {
	const t = await getTranslations("admin");
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		adminDashboardStatsQueryOptions(adminGetDashboardStats),
		adminEnrollmentStatsQueryOptions(adminGetEnrollmentStats),
		adminRecentCoursesQueryOptions(adminGetRecentCourses),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<AdminSectionCards />
			<AdminEnrollmentChartSection />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">{t("recentCourses")}</h2>
					<Link className={buttonVariants({ variant: "outline" })} href="/admin/courses">
						{t("viewAllCourses")}
					</Link>
				</div>
				<AdminRecentCoursesSection />
			</div>
		</QueryHydrationBoundary>
	);
}
