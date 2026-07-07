import { PublicCourseCardSkeleton } from "../_components/PublicCourseCard";

export default function Loading() {
	return (
		<div className="mt-5">
			<div className="mb-10 flex flex-col space-y-2">
				<div className="h-10 w-64 rounded-md bg-muted" />
				<div className="h-5 w-full max-w-xl rounded-md bg-muted" />
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 9 }, (_, index) => `public-course-route-skeleton-${index + 1}`).map(
					(key) => (
						<PublicCourseCardSkeleton key={key} />
					),
				)}
			</div>
		</div>
	);
}
