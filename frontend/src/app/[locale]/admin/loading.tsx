import { Skeleton } from "@/components/ui/skeleton";
import { AdminCourseCardSkeleton } from "./courses/_components/AdminCourseCard";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => `admin-stat-skeleton-${index + 1}`).map((key) => (
					<Skeleton key={key} className="h-28 w-full rounded-lg" />
				))}
			</div>
			<Skeleton className="h-[300px] w-full rounded-lg" />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-9 w-32" />
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, index) => `admin-recent-course-${index + 1}`).map(
						(key) => (
							<AdminCourseCardSkeleton key={key} />
						),
					)}
				</div>
			</div>
		</div>
	);
}
