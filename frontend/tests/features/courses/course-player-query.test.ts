import { QueryClient } from "@tanstack/react-query";
import type { CourseSidebarDataType, LessonContentType } from "@/features/courses";
import {
	courseSidebarQueryOptions,
	enrollmentStatusQueryOptions,
	lessonContentQueryOptions,
	markLessonContentCompleted,
	markSidebarLessonCompleted,
	rollbackCoursePlayerProgress,
} from "@/features/courses/hooks/use-course-player-query";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

const sidebarData: CourseSidebarDataType = {
	course: {
		id: "course-1",
		title: "React Course",
		slug: "react-course",
		category: "Development",
		description: "Learn React",
		smallDescription: "React basics",
		fileKey: "courses/react.png",
		price: 0,
		duration: 1,
		level: "Beginner",
		chapter: [
			{
				id: "chapter-1",
				title: "Intro",
				position: 1,
				lessons: [
					{
						id: "lesson-1",
						title: "Start",
						position: 1,
						description: null,
						lessonProgess: [{ lessonId: "lesson-1", completed: false }],
					},
				],
			},
		],
	},
};

const lessonContent: LessonContentType = {
	id: "lesson-1",
	title: "Start",
	description: null,
	thumbnailKey: null,
	videoKey: null,
	position: 1,
	lessonProgess: [{ lessonId: "lesson-1", completed: false }],
	Chapter: { courseId: "course-1", Course: { slug: "react-course" } },
};

describe("course player query helpers", () => {
	it("uses central query keys", () => {
		expect(courseSidebarQueryOptions("react-course").queryKey).toEqual(
			queryKeys.dashboard.courseSidebar("react-course"),
		);
		expect(lessonContentQueryOptions("lesson-1").queryKey).toEqual(
			queryKeys.dashboard.lessonContent("lesson-1"),
		);
		expect(enrollmentStatusQueryOptions("course-1").queryKey).toEqual(
			queryKeys.courses.enrollmentStatus("course-1"),
		);
		expect(courseSidebarQueryOptions("react-course").staleTime).toBe(queryStaleTimes.coursePlayer);
		expect(lessonContentQueryOptions("lesson-1").staleTime).toBe(queryStaleTimes.coursePlayer);
		expect(enrollmentStatusQueryOptions("course-1").staleTime).toBe(queryStaleTimes.enrollment);
	});

	it("marks lesson content and sidebar data completed with rollback support", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.dashboard.courseSidebar("react-course"), sidebarData);
		queryClient.setQueryData(queryKeys.dashboard.lessonContent("lesson-1"), lessonContent);
		const snapshot = {
			sidebar: queryClient.getQueryData<CourseSidebarDataType>(
				queryKeys.dashboard.courseSidebar("react-course"),
			),
			lesson: queryClient.getQueryData<LessonContentType>(
				queryKeys.dashboard.lessonContent("lesson-1"),
			),
		};

		markLessonContentCompleted(queryClient, "lesson-1");
		markSidebarLessonCompleted(queryClient, "react-course", "lesson-1");

		expect(
			queryClient
				.getQueryData<typeof lessonContent>(queryKeys.dashboard.lessonContent("lesson-1"))
				?.lessonProgess.some((progress) => progress.lessonId === "lesson-1" && progress.completed),
		).toBe(true);
		expect(
			queryClient
				.getQueryData<typeof sidebarData>(queryKeys.dashboard.courseSidebar("react-course"))
				?.course.chapter[0]?.lessons[0]?.lessonProgess.some(
					(progress) => progress.lessonId === "lesson-1" && progress.completed,
				),
		).toBe(true);

		rollbackCoursePlayerProgress(queryClient, "react-course", "lesson-1", snapshot);

		expect(queryClient.getQueryData(queryKeys.dashboard.courseSidebar("react-course"))).toEqual(
			sidebarData,
		);
		expect(queryClient.getQueryData(queryKeys.dashboard.lessonContent("lesson-1"))).toEqual(
			lessonContent,
		);
	});
});
