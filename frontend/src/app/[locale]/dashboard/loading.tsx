import { CourseGridSkeleton } from "@/features/courses";

export default function Loading() {
	return (
		<>
			<CourseGridSkeleton count={2} variant="progress" />
			<CourseGridSkeleton count={4} variant="public" />
		</>
	);
}
