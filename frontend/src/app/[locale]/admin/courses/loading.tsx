import { AdminCourseCardSkeleton } from "./_components/AdminCourseCard";

export default function Loading() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="h-9 w-64 rounded-md bg-muted" />
				<div className="h-10 w-40 rounded-md bg-muted" />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, (_, index) => `admin-course-route-skeleton-${index + 1}`).map(
					(key) => (
						<AdminCourseCardSkeleton key={key} />
					),
				)}
			</div>
		</div>
	);
}
