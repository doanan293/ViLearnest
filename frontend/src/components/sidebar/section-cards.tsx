import { IconBook, IconPlaylistX, IconShoppingCart, IconUser } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import { adminGetDashboardStats } from "@/app/data/admin/admin-get-dashboard-stats";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export async function SectionCards() {
	const { totalSignups, totalCustomers, totalCourses, totalLessons } =
		await adminGetDashboardStats();
	const t = await getTranslations("admin");

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Card className="@container/card">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div>
						<CardDescription>{t("totalSignups")}</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalSignups}
						</CardTitle>
					</div>
					<IconUser className="size-6 text-muted-foreground" />
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<p className="text-muted-foreground">{t("totalSignupsDescription")}</p>
				</CardFooter>
			</Card>
			<Card className="@container/card">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div>
						<CardDescription>{t("totalCustomers")}</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalCustomers}
						</CardTitle>
					</div>
					<IconShoppingCart className="size-6 text-muted-foreground" />
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<p className="text-muted-foreground">{t("totalCustomersDescription")}</p>
				</CardFooter>
			</Card>
			<Card className="@container/card">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div>
						<CardDescription>{t("totalCourses")}</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalCourses}
						</CardTitle>
					</div>
					<IconBook className="size-6 text-muted-foreground " />
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<p className="text-muted-foreground">{t("totalCoursesDescription")}</p>
				</CardFooter>
			</Card>
			<Card className="@container/card">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div>
						<CardDescription>{t("totalLessons")}</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalLessons}
						</CardTitle>
					</div>
					<IconPlaylistX className="size-6 text-muted-foreground" />
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<p className="text-muted-foreground">{t("totalLessonsDescription")}</p>
				</CardFooter>
			</Card>
		</div>
	);
}
