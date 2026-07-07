"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/general/EmptyState";
import { useEnrolledCoursesQuery } from "@/features/courses/hooks/use-dashboard-courses-query";
import { CourseGridSkeleton } from "./CourseCardSkeleton";
import { CourseProgressCard } from "./CourseProgressCard";

export function EnrolledCoursesClientSection() {
	const t = useTranslations("dashboard");
	const { data: enrolledCourses = [], isLoading } = useEnrolledCoursesQuery();

	if (isLoading) return <CourseGridSkeleton count={2} variant="progress" />;

	return (
		<>
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold">{t("enrolledCourses")}</h1>
				<p className="text-muted-foreground">{t("enrolledCoursesDescription")}</p>
			</div>
			{enrolledCourses.length === 0 ? (
				<EmptyState
					title={t("noCoursesPurchasedTitle")}
					description={t("noCoursesPurchasedDescription")}
					buttonText={t("browseCourses")}
					href="/courses"
				/>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{enrolledCourses.map((course) => (
						<CourseProgressCard key={course.Course.id} data={course} />
					))}
				</div>
			)}
		</>
	);
}
