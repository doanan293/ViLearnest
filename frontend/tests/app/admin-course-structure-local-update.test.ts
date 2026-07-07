import { readFileSync } from "node:fs";
import { join } from "node:path";

const componentDir = join(
	process.cwd(),
	"src",
	"app",
	"[locale]",
	"admin",
	"courses",
	"[courseId]",
	"edit",
	"_components",
);

const mutationComponents = [
	"NewChapterModal.tsx",
	"NewLessonModal.tsx",
	"DeleteChapter.tsx",
	"DeleteLesson.tsx",
];

describe("admin course structure local updates", () => {
	it.each(mutationComponents)("%s does not refresh the route after a mutation", (fileName) => {
		const source = readFileSync(join(componentDir, fileName), "utf8");

		expect(source).not.toContain('import { useRouter } from "next/navigation"');
		expect(source).not.toContain("useRouter()");
		expect(source).not.toContain("router.refresh()");
	});

	it("delegates create and delete structure updates to the query cache", () => {
		const source = readFileSync(join(componentDir, "CourseStructure.tsx"), "utf8");

		expect(source).not.toContain("function addChapter");
		expect(source).not.toContain("function addLesson");
		expect(source).not.toContain("function removeChapter");
		expect(source).not.toContain("function removeLesson");
		expect(source).toContain("<NewChapterModal courseId={data.id} />");
		expect(source).toContain("<DeleteChapter chapterId={item.id} courseId={data.id} />");
		expect(source).toContain("<NewLessonModal chapterId={item.id} courseId={data.id} />");
		expect(source).toContain("lessonId={lesson.id}");
		expect(source).not.toContain("onCreated={addChapter}");
		expect(source).not.toContain("onDeleted={() => removeChapter(item.id)}");
		expect(source).not.toContain("onCreated={(lesson) => addLesson(item.id, lesson)}");
		expect(source).not.toContain("onDeleted={() => removeLesson(item.id, lesson.id)}");
	});

	it("uses the shared collapsible trigger for chapter toggles", () => {
		const source = readFileSync(join(componentDir, "CourseStructure.tsx"), "utf8");

		expect(source).toContain(
			'import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"',
		);
		expect(source).toContain("<CollapsibleTrigger asChild>");
	});
});
