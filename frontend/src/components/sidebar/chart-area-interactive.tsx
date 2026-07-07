"use client";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "An interactive area chart";

interface ChartAreaInteractiveProps {
	data: Array<{ date: string; enrollments: number }>;
}
export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
	const t = useTranslations("admin");
	const chartConfig = {
		enrollments: { label: t("enrollments"), color: "var(--chart-1)" },
	} satisfies ChartConfig;
	const totalEnrollmentsNumber = useMemo(
		() => data.reduce((acc, curr) => acc + curr.enrollments, 0),
		[data],
	);
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardTitle>{t("totalEnrollments")}</CardTitle>
				<CardDescription>
					<span className="hidden @[540px]/card:block">
						{t("totalEnrollmentsLast30", { count: totalEnrollmentsNumber })}
					</span>
					<span className="@[540px]/card:hidden">
						{t("last30Days", { count: totalEnrollmentsNumber })}
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
					<BarChart data={data} margin={{ left: 12, right: 12 }}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							interval={"preserveStartEnd"}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="w-[150px]"
									labelFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										});
									}}
								/>
							}
						/>
						<Bar dataKey={"enrollments"} fill="var(--color-enrollments)" />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
