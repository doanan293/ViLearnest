"use client";
import { useMemo } from "react";

interface CourseProgressLesson {
	id: string;
	lessonProgess: Array<{
		lessonId: string;
		completed: boolean;
	}>;
}

interface CourseProgressData {
	chapter: Array<{
		lessons: Array<CourseProgressLesson>;
	}>;
}

interface iAppProps {
	courseData: CourseProgressData;
}

interface CourseProgressResult {
	totalLessons: number;
	completedLessons: number;
	progressPercentage: number;
}

export function useCourseProgress({ courseData }: iAppProps): CourseProgressResult {
	return useMemo(() => {
		let totalLessons = 0;
		let completedLessons = 0;

		courseData.chapter.forEach((chapter) => {
			chapter.lessons.forEach((lesson) => {
				totalLessons++;

				const isCompleted = lesson.lessonProgess.some(
					(progress) => progress.lessonId === lesson.id && progress.completed,
				);

				if (isCompleted) {
					completedLessons++;
				}
			});
		});

		const progressPercentage =
			totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
		return { totalLessons, completedLessons, progressPercentage };
	}, [courseData]);
}
