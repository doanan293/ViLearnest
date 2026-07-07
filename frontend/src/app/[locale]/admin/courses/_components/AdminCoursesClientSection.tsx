"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/general/EmptyState";
import { adminCourseListQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";
import { AdminCourseCard, AdminCourseCardSkeleton } from "./AdminCourseCard";

export function AdminCoursesClientSection() {
	const t = useTranslations("admin");
	const { data: courses = [], isLoading } = useQuery(adminCourseListQueryOptions());

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				{["admin-course-1", "admin-course-2", "admin-course-3"].map((key) => (
					<AdminCourseCardSkeleton key={key} />
				))}
			</div>
		);
	}

	if (courses.length === 0) {
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
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{courses.map((course) => (
				<AdminCourseCard key={course.id} data={course} />
			))}
		</div>
	);
}
