import { readFileSync } from "node:fs";
import { join } from "node:path";

const directMutationFiles = [
	join(process.cwd(), "src", "features", "users", "components", "ProfileForm.tsx"),
	join(
		process.cwd(),
		"src",
		"app",
		"[locale]",
		"admin",
		"courses",
		"[courseId]",
		"[chapterId]",
		"[lessonId]",
		"_components",
		"LessonForm.tsx",
	),
	join(
		process.cwd(),
		"src",
		"app",
		"[locale]",
		"dashboard",
		"[slug]",
		"[lessonId]",
		"_components",
		"CourseContent.tsx",
	),
];

describe("client mutation query boundary", () => {
	it.each(directMutationFiles)("%s uses mutation hooks instead of direct API calls", (filePath) => {
		const source = readFileSync(filePath, "utf8");

		expect(source).not.toContain("api.");
		expect(source).not.toContain("tryCatch(");
	});
});
