"use client";

import { useTranslations } from "next-intl";
import { PublicCourseCard } from "@/app/[locale]/(public)/_components/PublicCourseCard";
import { EmptyState } from "@/components/general/EmptyState";
import { useAvailableCoursesQuery } from "@/features/courses/hooks/use-dashboard-courses-query";
import { CourseGridSkeleton } from "./CourseCardSkeleton";

export function AvailableCoursesClientSection() {
	const t = useTranslations("dashboard");
	const { data: availableCourses = [], isLoading } = useAvailableCoursesQuery();

	if (isLoading) return <CourseGridSkeleton count={4} variant="public" />;

	return (
		<section className="mt-10">
			<div className="mb-5 flex flex-col gap-2">
				<h1 className="text-3xl font-bold">{t("availableCourses")}</h1>
				<p className="text-muted-foreground">{t("availableCoursesDescription")}</p>
			</div>
			{availableCourses.length === 0 ? (
				<EmptyState
					title={t("noCoursesAvailableTitle")}
					description={t("noCoursesAvailableDescription")}
					buttonText={t("browseCourses")}
					href="/courses"
				/>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{availableCourses.map((course) => (
						<PublicCourseCard key={course.id} data={course} />
					))}
				</div>
			)}
		</section>
	);
}
