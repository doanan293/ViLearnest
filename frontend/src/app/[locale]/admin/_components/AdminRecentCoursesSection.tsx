"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/general/EmptyState";
import { adminRecentCoursesQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";
import { AdminCourseCard, AdminCourseCardSkeleton } from "../courses/_components/AdminCourseCard";

export function AdminRecentCoursesSection() {
	const t = useTranslations("admin");
	const { data = [], isLoading } = useQuery(adminRecentCoursesQueryOptions());

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{["recent-course-1", "recent-course-2"].map((key) => (
					<AdminCourseCardSkeleton key={key} />
				))}
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<EmptyState
				buttonText={t("createNewCourse")}
				description={t("noCoursesDescription")}
				title={t("noCoursesTitle")}
				href="/admin/courses/create"
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{data.map((course) => (
				<AdminCourseCard key={course.id} data={course} />
			))}
		</div>
	);
}
