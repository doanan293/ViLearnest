import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { LessonSchemaType } from "@/lib/zodSchemas";

type OrderedItem = { id: string; position: number };
type StructureChapterInput = { id: string; title: string; position: number };
type StructureLessonInput = { id: string; title: string; position: number };
type StructureLesson = { id: string; position: number; title?: string };
type StructureChapter = {
	id: string;
	position: number;
	title?: string;
	lessons: Array<StructureLesson>;
};
type CourseStructure = {
	id: string;
	chapter: Array<StructureChapter>;
};

function sortByPosition<T extends { position: number }>(items: Array<T>) {
	return [...items].sort((first, second) => first.position - second.position);
}

export function applyReorderedStructure(
	queryClient: QueryClient,
	courseId: string,
	orderedChapters: Array<OrderedItem>,
) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			const positionById = new Map(orderedChapters.map((item) => [item.id, item.position]));
			return {
				...current,
				chapter: [...current.chapter]
					.map((chapter) => ({
						...chapter,
						position: positionById.get(chapter.id) ?? chapter.position,
					}))
					.sort((a, b) => a.position - b.position),
			};
		},
	);
}

export function rollbackCourseStructure(
	queryClient: QueryClient,
	courseId: string,
	previous: CourseStructure | undefined,
) {
	queryClient.setQueryData(queryKeys.admin.courseStructure(courseId), previous);
}

export function applyReorderedLessons(
	queryClient: QueryClient,
	courseId: string,
	chapterId: string,
	orderedLessons: Array<OrderedItem>,
) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			const positionById = new Map(orderedLessons.map((item) => [item.id, item.position]));
			return {
				...current,
				chapter: current.chapter.map((chapter) => {
					if (chapter.id !== chapterId) return chapter;
					return {
						...chapter,
						lessons: sortByPosition(
							chapter.lessons.map((lesson) => ({
								...lesson,
								position: positionById.get(lesson.id) ?? lesson.position,
							})),
						),
					};
				}),
			};
		},
	);
}

export function applyCreatedChapter(
	queryClient: QueryClient,
	courseId: string,
	chapter: StructureChapterInput,
) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			return {
				...current,
				chapter: sortByPosition([...current.chapter, { ...chapter, lessons: [] }]),
			};
		},
	);
}

export function applyDeletedChapter(queryClient: QueryClient, courseId: string, chapterId: string) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			return {
				...current,
				chapter: current.chapter.filter((chapter) => chapter.id !== chapterId),
			};
		},
	);
}

export function applyCreatedLesson(
	queryClient: QueryClient,
	courseId: string,
	chapterId: string,
	lesson: StructureLessonInput,
) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			return {
				...current,
				chapter: current.chapter.map((chapter) => {
					if (chapter.id !== chapterId) return chapter;
					return {
						...chapter,
						lessons: sortByPosition([...chapter.lessons, lesson]),
					};
				}),
			};
		},
	);
}

export function applyDeletedLesson(
	queryClient: QueryClient,
	courseId: string,
	chapterId: string,
	lessonId: string,
) {
	queryClient.setQueryData<CourseStructure>(
		queryKeys.admin.courseStructure(courseId),
		(current) => {
			if (!current) return current;
			return {
				...current,
				chapter: current.chapter.map((chapter) => {
					if (chapter.id !== chapterId) return chapter;
					return {
						...chapter,
						lessons: chapter.lessons.filter((lesson) => lesson.id !== lessonId),
					};
				}),
			};
		},
	);
}

export function useReorderChaptersMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chapters: Array<OrderedItem>) => api.admin.reorderChapters(courseId, chapters),
		onMutate: async (chapters) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			const previous = queryClient.getQueryData<CourseStructure>(
				queryKeys.admin.courseStructure(courseId),
			);
			applyReorderedStructure(queryClient, courseId, chapters);
			return { previous };
		},
		onError: (_error, _chapters, context) => {
			rollbackCourseStructure(queryClient, courseId, context?.previous);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
		},
	});
}

export function useReorderLessonsMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ chapterId, lessons }: { chapterId: string; lessons: Array<OrderedItem> }) =>
			api.admin.reorderLessons(courseId, chapterId, lessons),
		onMutate: async ({ chapterId, lessons }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			const previous = queryClient.getQueryData<CourseStructure>(
				queryKeys.admin.courseStructure(courseId),
			);
			applyReorderedLessons(queryClient, courseId, chapterId, lessons);
			return { previous };
		},
		onError: (_error, _variables, context) => {
			rollbackCourseStructure(queryClient, courseId, context?.previous);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
		},
	});
}

export function useCreateChapterMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: api.admin.createChapter,
		onSuccess: (result) => {
			if (result.chapter) {
				applyCreatedChapter(queryClient, courseId, result.chapter);
			}
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
		},
	});
}

export function useDeleteChapterMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chapterId: string) => api.admin.deleteChapter(courseId, chapterId),
		onSuccess: (_result, chapterId) => {
			applyDeletedChapter(queryClient, courseId, chapterId);
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
		},
	});
}

export function useCreateLessonMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: api.admin.createLesson,
		onSuccess: (result, values) => {
			if (result.lesson) {
				applyCreatedLesson(queryClient, courseId, values.chapterId, result.lesson);
			}
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
		},
	});
}

export function useDeleteLessonMutation(courseId: string, chapterId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (lessonId: string) => api.admin.deleteLesson(courseId, chapterId, lessonId),
		onSuccess: (_result, lessonId) => {
			applyDeletedLesson(queryClient, courseId, chapterId, lessonId);
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.lesson(lessonId) });
		},
	});
}

export function useUpdateLessonMutation(courseId: string, lessonId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (values: LessonSchemaType) => api.admin.updateLesson(lessonId, values),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.lesson(lessonId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courseStructure(courseId) });
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
		},
	});
}
