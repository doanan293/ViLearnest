"use client";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { useEnrollmentStatusQuery } from "@/features/courses/hooks/use-course-player-query";
import { Link } from "@/i18n/navigation";
import { EnrollmentButton } from "./EnrollmentButton";

export function EnrollmentCta({ courseId }: { courseId: string }) {
	const { data: isEnrolled, isError, isFetching, refetch } = useEnrollmentStatusQuery(courseId);
	const t = useTranslations("courses");
	const tCommon = useTranslations("common");

	if (isEnrolled === undefined && isFetching) {
		return (
			<button type="button" className={buttonVariants({ className: "w-full" })} disabled>
				{tCommon("loading")}
			</button>
		);
	}

	if (isError) {
		return (
			<button
				type="button"
				className={buttonVariants({ className: "w-full" })}
				disabled={isFetching}
				onClick={() => void refetch()}
			>
				{isFetching ? tCommon("loading") : t("enrollNow")}
			</button>
		);
	}

	if (isEnrolled) {
		return (
			<Link className={buttonVariants({ className: "w-full" })} href="/dashboard">
				{t("watchCourse")}
			</Link>
		);
	}

	return <EnrollmentButton courseId={courseId} />;
}
