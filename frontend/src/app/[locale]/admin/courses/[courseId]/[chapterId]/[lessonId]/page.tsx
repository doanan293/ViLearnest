import { QueryClient } from "@tanstack/react-query";
import { adminGetLesson } from "@/features/courses";
import { adminLessonQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";
import { LessonForm } from "./_components/LessonForm";

type Params = Promise<{
	courseId: string;
	chapterId: string;
	lessonId: string;
}>;

export default async function LessonIdPage({ params }: { params: Params }) {
	const { courseId, chapterId, lessonId } = await params;
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		adminLessonQueryOptions(lessonId, () => adminGetLesson(lessonId)),
	]);
	const lesson = queryClient.getQueryData<Awaited<ReturnType<typeof adminGetLesson>>>(
		adminLessonQueryOptions(lessonId).queryKey,
	);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<LessonForm
				data={lesson ?? (await adminGetLesson(lessonId))}
				chapterId={chapterId}
				courseId={courseId}
			/>
		</QueryHydrationBoundary>
	);
}
