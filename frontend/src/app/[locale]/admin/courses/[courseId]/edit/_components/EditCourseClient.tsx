"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	adminCourseDetailQueryOptions,
	adminCourseStructureQueryOptions,
} from "@/features/courses/hooks/use-admin-course-queries";
import type { Locale } from "@/i18n/pathname";
import { displayTitle } from "@/lib/localized-text";
import { CourseStructure } from "./CourseStructure";
import { EditCourseForm } from "./EditCourseForm";

export function EditCourseClient({ courseId }: { courseId: string }) {
	const t = useTranslations("admin");
	const locale = useLocale() as Locale;
	const { data: course, isLoading } = useQuery(adminCourseDetailQueryOptions(courseId));
	const { data: structure } = useQuery(adminCourseStructureQueryOptions(courseId));

	if (isLoading || !course) return <EditCourseClientSkeleton />;

	return (
		<>
			<h1 className="mb-8 text-3xl font-bold">
				{t("editCourse")}{" "}
				<span className="text-primary underline">{displayTitle(course, locale)}</span>
			</h1>
			<Tabs defaultValue="basic-info" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="basic-info">{t("basicInfo")}</TabsTrigger>
					<TabsTrigger value="course-structure">{t("courseStructure")}</TabsTrigger>
				</TabsList>
				<TabsContent value="basic-info">
					<Card>
						<CardHeader>
							<CardTitle>{t("basicInfo")}</CardTitle>
							<CardDescription>{t("editBasicInfoDescription")}</CardDescription>
						</CardHeader>
						<CardContent>
							<EditCourseForm data={course} />
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="course-structure">
					<Card>
						<CardHeader>
							<CardTitle>{t("courseStructure")}</CardTitle>
							<CardDescription>{t("courseStructureDescription")}</CardDescription>
						</CardHeader>
						<CardContent>
							<CourseStructure data={structure ?? course} />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</>
	);
}

function EditCourseClientSkeleton() {
	return (
		<div className="w-full">
			<div className="mb-8 flex items-center gap-2">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-9 w-64" />
			</div>
			<Skeleton className="h-9 w-full rounded-md" />
		</div>
	);
}
