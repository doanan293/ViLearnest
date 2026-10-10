import { QueryClient } from "@tanstack/react-query";
import { getLessonContent } from "@/features/courses";
import { lessonContentQueryOptions } from "@/features/courses/hooks/use-course-player-query";
import { QueryHydrationBoundary } from "@/lib/query-hydration";
import { CourseContent } from "./_components/CourseContent";

type Params = Promise<{ lessonId: string }>;

export default async function LessonContenPage({ params }: { params: Params }) {
	const { lessonId } = await params;
	return <LessonContentLoader lessonId={lessonId} />;
}

async function LessonContentLoader({ lessonId }: { lessonId: string }) {
	const queryClient = new QueryClient();
	await queryClient.fetchQuery(
		lessonContentQueryOptions(lessonId, () => getLessonContent(lessonId)),
	);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<CourseContent lessonId={lessonId} />
		</QueryHydrationBoundary>
	);
}
