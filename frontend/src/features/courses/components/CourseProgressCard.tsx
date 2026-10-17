"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrolledCourseType } from "@/features/users";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Link } from "@/i18n/navigation";
import { levelLabel } from "@/lib/course-labels";
import { useCourseProgress } from "../hooks/use-course-progress";
import { useCourseSidebarIntentPrefetch } from "../hooks/use-intent-prefetch";

interface iAppProps {
	data: EnrolledCourseType;
}

export function CourseProgressCard({ data }: iAppProps) {
	const thumbnailUrl = useConstructUrl(data.Course.fileKey);
	const tCourses = useTranslations("courses");
	const tDashboard = useTranslations("dashboard");
	const prefetchCourseSidebar = useCourseSidebarIntentPrefetch(data.Course.slug);
	const { totalLessons, completedLessons, progressPercentage } = useCourseProgress({
		courseData: data.Course,
	});
	return (
		<Card className="group relative py-0 gap-0">
			<Badge className="absolute top-2 right-2 z-10">
				{levelLabel(tCourses, data.Course.level)}
			</Badge>
			<Image
				width={600}
				height={400}
				src={thumbnailUrl}
				className="w-full rounded-t-xl aspect-video h-full object-cover"
				alt={tCourses("thumbnailAlt")}
				sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
			/>
			<CardContent className="p-4">
				<Link
					className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
					href={`/dashboard/${data.Course.slug}`}
					onFocus={prefetchCourseSidebar}
					onPointerEnter={prefetchCourseSidebar}
					onTouchStart={prefetchCourseSidebar}
				>
					{data.Course.title}
				</Link>
				<p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
					{data.Course.smallDescription}
				</p>
				<div className="space-y-4 mt-5">
					<div className="flex justify-between mb-1 text-sm">
						<p>{tDashboard("progress")}:</p>
						<div className="font-medium">{progressPercentage}%</div>
					</div>
					<Progress value={progressPercentage} className="h-1.5" />
					<p className="text-xs text-muted-foreground mt-1">
						{tDashboard("progressSummary", { completed: completedLessons, total: totalLessons })}
					</p>
				</div>
				<Link
					href={`/dashboard/${data.Course.slug}`}
					className={buttonVariants({ className: "w-full mt-4" })}
					onFocus={prefetchCourseSidebar}
					onPointerEnter={prefetchCourseSidebar}
					onTouchStart={prefetchCourseSidebar}
				>
					{tCourses("learnMore")}
				</Link>
			</CardContent>
		</Card>
	);
}

export function PublicCourseCardSkeleton() {
	return (
		<Card className="group relative py-0 gap-0">
			<div className="absolute top-2 right-2 z-10 flex items-center">
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
			<div className="w-full relative h-fit">
				<Skeleton className="w-full rounded-t-xl aspect-video" />
			</div>
			<CardContent className="p-4">
				<div className="space-y-2">
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-3/4" />
				</div>
				<div className="mt-4 flex items-center gap-x-5">
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-8" />
					</div>
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-8" />
					</div>
				</div>
				<Skeleton className="mt-4 w-full h-10 rounded-md" />
			</CardContent>
		</Card>
	);
}
