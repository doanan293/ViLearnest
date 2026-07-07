"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { CourseSidebarDataType } from "../api/get-course-sidebar-data";

export type CourseProgressCourse = CourseSidebarDataType["course"];

type CourseProgressContextValue = {
	course: CourseProgressCourse;
	markLessonCompleted: (lessonId: string) => void;
};

const CourseProgressContext = createContext<CourseProgressContextValue | null>(null);

export function completeLessonInCourse(
	course: CourseProgressCourse,
	lessonId: string,
): CourseProgressCourse {
	let didChange = false;

	const chapter = course.chapter.map((chapterItem) => {
		let chapterChanged = false;
		const lessons = chapterItem.lessons.map((lesson) => {
			if (lesson.id !== lessonId) {
				return lesson;
			}

			const isAlreadyCompleted = lesson.lessonProgess.some(
				(progress) => progress.lessonId === lessonId && progress.completed,
			);

			if (isAlreadyCompleted) {
				return lesson;
			}

			didChange = true;
			chapterChanged = true;

			return {
				...lesson,
				lessonProgess: [...lesson.lessonProgess, { completed: true, lessonId }],
			};
		});

		return chapterChanged ? { ...chapterItem, lessons } : chapterItem;
	});

	return didChange ? { ...course, chapter } : course;
}

export function CourseProgressProvider({
	children,
	initialCourse,
}: {
	children: ReactNode;
	initialCourse: CourseProgressCourse;
}) {
	const [course, setCourse] = useState(initialCourse);

	const markLessonCompleted = useCallback((lessonId: string) => {
		setCourse((currentCourse) => completeLessonInCourse(currentCourse, lessonId));
	}, []);

	const value = useMemo(() => ({ course, markLessonCompleted }), [course, markLessonCompleted]);

	return <CourseProgressContext.Provider value={value}>{children}</CourseProgressContext.Provider>;
}

export function useCourseProgressState() {
	const context = useContext(CourseProgressContext);

	if (!context) {
		throw new Error("useCourseProgressState must be used inside CourseProgressProvider");
	}

	return context;
}
