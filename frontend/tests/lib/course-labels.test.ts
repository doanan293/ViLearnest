import { categoryLabel, levelLabel } from "@/lib/course-labels";
import { courseCategories, courseLevels } from "@/lib/zodSchemas";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

function translator(messages: Record<string, unknown>) {
	return (key: string) =>
		key
			.split(".")
			.reduce<unknown>(
				(node, part) => (node as Record<string, unknown>)?.[part],
				messages,
			) as string;
}

describe("course labels", () => {
	it("translates every level and category in both languages", () => {
		for (const messages of [en.courses, vi.courses]) {
			const t = translator(messages);
			for (const level of courseLevels) expect(levelLabel(t, level)).toEqual(expect.any(String));
			for (const category of courseCategories) {
				expect(categoryLabel(t, category)).toEqual(expect.any(String));
			}
		}
	});

	it("shows Vietnamese level names on Vietnamese pages", () => {
		expect(levelLabel(translator(vi.courses), "Beginner")).toBe("Cơ bản");
	});

	it("keeps an unknown category as stored", () => {
		expect(categoryLabel(translator(en.courses), "Testing")).toBe("Testing");
	});
});
