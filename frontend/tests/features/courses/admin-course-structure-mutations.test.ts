import { QueryClient } from "@tanstack/react-query";
import {
	applyCreatedChapter,
	applyCreatedLesson,
	applyDeletedChapter,
	applyDeletedLesson,
	applyReorderedLessons,
	applyReorderedStructure,
	rollbackCourseStructure,
} from "@/features/courses/hooks/use-admin-course-structure-mutations";
import { queryKeys } from "@/lib/query-keys";

const originalStructure = {
	id: "course-1",
	chapter: [
		{ id: "chapter-1", position: 0, lessons: [{ id: "lesson-1", position: 0 }] },
		{ id: "chapter-2", position: 1, lessons: [{ id: "lesson-2", position: 0 }] },
	],
};

const lessonStructure = {
	id: "course-1",
	chapter: [
		{
			id: "chapter-1",
			position: 0,
			lessons: [
				{ id: "lesson-1", position: 0 },
				{ id: "lesson-2", position: 1 },
			],
		},
	],
};

describe("admin course structure cache helpers", () => {
	it("optimistically reorders course structure", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.admin.courseStructure("course-1"), originalStructure);

		applyReorderedStructure(queryClient, "course-1", [
			{ id: "chapter-2", position: 0 },
			{ id: "chapter-1", position: 1 },
		]);

		expect(queryClient.getQueryData(queryKeys.admin.courseStructure("course-1"))).toEqual({
			id: "course-1",
			chapter: [
				{ id: "chapter-2", position: 0, lessons: [{ id: "lesson-2", position: 0 }] },
				{ id: "chapter-1", position: 1, lessons: [{ id: "lesson-1", position: 0 }] },
			],
		});
	});

	it("rolls back structure after failed optimistic update", () => {
		const queryClient = new QueryClient();
		applyReorderedStructure(queryClient, "course-1", [{ id: "chapter-2", position: 0 }]);
		rollbackCourseStructure(queryClient, "course-1", originalStructure);

		expect(queryClient.getQueryData(queryKeys.admin.courseStructure("course-1"))).toEqual(
			originalStructure,
		);
	});

	it("applies and rolls back lesson reorder in the course structure cache", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.admin.courseStructure("course-1"), lessonStructure);

		applyReorderedLessons(queryClient, "course-1", "chapter-1", [
			{ id: "lesson-2", position: 0 },
			{ id: "lesson-1", position: 1 },
		]);

		expect(
			queryClient
				.getQueryData<typeof lessonStructure>(queryKeys.admin.courseStructure("course-1"))
				?.chapter[0]?.lessons.map((lesson) => lesson.id),
		).toEqual(["lesson-2", "lesson-1"]);

		rollbackCourseStructure(queryClient, "course-1", lessonStructure);

		expect(queryClient.getQueryData(queryKeys.admin.courseStructure("course-1"))).toEqual(
			lessonStructure,
		);
	});

	it("applies created and deleted chapters and lessons to the structure cache", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.admin.courseStructure("course-1"), originalStructure);

		applyCreatedChapter(queryClient, "course-1", {
			id: "chapter-3",
			title: "Chapter 3",
			position: 2,
		});
		applyCreatedLesson(queryClient, "course-1", "chapter-3", {
			id: "lesson-3",
			title: "Lesson 3",
			position: 0,
		});
		applyDeletedLesson(queryClient, "course-1", "chapter-1", "lesson-1");
		applyDeletedChapter(queryClient, "course-1", "chapter-3");

		expect(queryClient.getQueryData(queryKeys.admin.courseStructure("course-1"))).toEqual({
			id: "course-1",
			chapter: [
				{ id: "chapter-1", position: 0, lessons: [] },
				{ id: "chapter-2", position: 1, lessons: [{ id: "lesson-2", position: 0 }] },
			],
		});
	});
});
