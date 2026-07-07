"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminEnrollmentStatsQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";

export function AdminEnrollmentChartSection() {
	const t = useTranslations("admin");
	const { data = [], isLoading } = useQuery(adminEnrollmentStatsQueryOptions());

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("totalEnrollments")}</CardTitle>
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return <ChartAreaInteractive data={data} />;
}
