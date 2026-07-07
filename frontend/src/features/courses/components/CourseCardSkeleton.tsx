import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CourseProgressCardSkeleton() {
	return (
		<Card className="relative py-0 gap-0">
			<Skeleton className="absolute top-2 right-2 z-10 h-5 w-20" />
			<Skeleton className="w-full rounded-t-xl aspect-video" />
			<CardContent className="p-4">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-full mt-2" />
				<Skeleton className="h-4 w-2/3 mt-1" />
				<div className="space-y-4 mt-5">
					<div className="flex justify-between mb-1">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-10" />
					</div>
					<Skeleton className="h-1.5 w-full" />
					<Skeleton className="h-3 w-40" />
					<Skeleton className="h-10 w-full" />
				</div>
			</CardContent>
		</Card>
	);
}

export function PublicCourseCardSkeleton() {
	return (
		<Card className="relative py-0 gap-0">
			<Skeleton className="absolute top-2 right-2 z-10 h-5 w-20" />
			<Skeleton className="w-full rounded-t-xl aspect-video" />
			<CardContent className="p-4">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-full mt-2" />
				<Skeleton className="h-4 w-2/3 mt-1" />
				<div className="mt-4 flex items-center gap-x-5">
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-10" />
					</div>
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-20" />
					</div>
				</div>
				<Skeleton className="h-10 w-full mt-4" />
				<div className="flex items-center justify-between mt-4">
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-6 w-10" />
				</div>
			</CardContent>
		</Card>
	);
}

export function CourseGridSkeleton({
	count = 4,
	variant = "progress",
}: {
	count?: number;
	variant?: "progress" | "public";
}) {
	const SkeletonComponent =
		variant === "progress" ? CourseProgressCardSkeleton : PublicCourseCardSkeleton;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{Array.from({ length: count }, (_, index) => `course-grid-skeleton-${index + 1}`).map(
				(key) => (
					<SkeletonComponent key={key} />
				),
			)}
		</div>
	);
}
