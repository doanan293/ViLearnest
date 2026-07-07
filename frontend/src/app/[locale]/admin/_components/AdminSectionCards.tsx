"use client";

import { IconBook, IconPlaylistX, IconShoppingCart, IconUser } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDashboardStatsQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";

export function AdminSectionCards() {
	const t = useTranslations("admin");
	const {
		data = {
			totalSignups: 0,
			totalCustomers: 0,
			totalCourses: 0,
			totalLessons: 0,
		},
	} = useQuery(adminDashboardStatsQueryOptions());

	const cards = [
		{
			description: t("totalSignups"),
			title: data.totalSignups,
			footer: t("totalSignupsDescription"),
			icon: IconUser,
		},
		{
			description: t("totalCustomers"),
			title: data.totalCustomers,
			footer: t("totalCustomersDescription"),
			icon: IconShoppingCart,
		},
		{
			description: t("totalCourses"),
			title: data.totalCourses,
			footer: t("totalCoursesDescription"),
			icon: IconBook,
		},
		{
			description: t("totalLessons"),
			title: data.totalLessons,
			footer: t("totalLessonsDescription"),
			icon: IconPlaylistX,
		},
	];

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{cards.map(({ description, title, footer, icon: Icon }) => (
				<Card key={description} className="@container/card">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<div>
							<CardDescription>{description}</CardDescription>
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
								{title}
							</CardTitle>
						</div>
						<Icon className="size-6 text-muted-foreground" />
					</CardHeader>
					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<p className="text-muted-foreground">{footer}</p>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
