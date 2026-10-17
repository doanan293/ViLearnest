import { QueryClient } from "@tanstack/react-query";
import { getLessonContent } from "@/features/courses";
import { lessonContentQueryOptions } from "@/features/courses/hooks/use-course-player-query";
import type { Locale } from "@/i18n/pathname";
import { QueryHydrationBoundary } from "@/lib/query-hydration";
import { CourseContent } from "./_components/CourseContent";

type Params = Promise<{ lessonId: string; locale: string }>;

export default async function LessonContenPage({ params }: { params: Params }) {
	const { lessonId, locale } = await params;
	return <LessonContentLoader lessonId={lessonId} locale={locale as Locale} />;
}

async function LessonContentLoader({ lessonId, locale }: { lessonId: string; locale: Locale }) {
	const queryClient = new QueryClient();
	await queryClient.fetchQuery(
		lessonContentQueryOptions(lessonId, locale, () => getLessonContent(lessonId)),
	);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<CourseContent lessonId={lessonId} />
		</QueryHydrationBoundary>
	);
}
