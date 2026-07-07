import type { CourseSidebarDataType } from "@/features/courses";
import { completeLessonInCourse } from "@/features/courses/components/CourseProgressProvider";

function createCourse(): CourseSidebarDataType["course"] {
	return {
		id: "course-1",
		title: "AI Fast",
		description: "Course description",
		fileKey: "course-thumbnail",
		price: 0,
		duration: 10,
		level: "Beginner",
		category: "Development",
		smallDescription: "Short course description",
		slug: "ai-fast",
		chapter: [
			{
				id: "chapter-1",
				title: "Chapter 1",
				position: 1,
				lessons: [
					{
						id: "lesson-1",
						title: "Lesson 1",
						position: 1,
						description: null,
						lessonProgess: [],
					},
					{
						id: "lesson-2",
						title: "Lesson 2",
						position: 2,
						description: null,
						lessonProgess: [],
					},
				],
			},
		],
	};
}

describe("completeLessonInCourse", () => {
	it("marks only the matching lesson as completed", () => {
		const course = createCourse();

		const updated = completeLessonInCourse(course, "lesson-1");

		expect(updated.chapter[0]?.lessons[0]?.lessonProgess).toEqual([
			{ completed: true, lessonId: "lesson-1" },
		]);
		expect(updated.chapter[0]?.lessons[1]?.lessonProgess).toEqual([]);
		expect(updated).not.toBe(course);
	});

	it("does not add duplicate completed rows for an already completed lesson", () => {
		const course = completeLessonInCourse(createCourse(), "lesson-1");

		const updated = completeLessonInCourse(course, "lesson-1");

		expect(updated).toBe(course);
		expect(updated.chapter[0]?.lessons[0]?.lessonProgess).toEqual([
			{ completed: true, lessonId: "lesson-1" },
		]);
	});

	it("returns the original course if the lesson id is unknown", () => {
		const course = createCourse();

		const updated = completeLessonInCourse(course, "missing-lesson");

		expect(updated).toBe(course);
	});
});
