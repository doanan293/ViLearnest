import { chapterSchema, courseSchema, lessonSchema, slugSource } from "@/lib/zodSchemas";

const course = {
	titleEn: "",
	titleVi: "",
	smallDescriptionEn: "",
	smallDescriptionVi: "",
	descriptionEn: "",
	descriptionVi: "",
	fileKey: "cover.png",
	price: 10,
	duration: 5,
	level: "Beginner",
	category: "Development",
	slug: "khoa-a",
	status: "Draft",
};

describe("bilingual course schemas", () => {
	it("accepts a course with only a Vietnamese title", () => {
		expect(courseSchema.safeParse({ ...course, titleVi: "Khóa A" }).success).toBe(true);
	});

	it("rejects a course with no title in either language on titleEn", () => {
		const result = courseSchema.safeParse(course);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(["titleEn"]);
	});

	it("accepts a chapter named only in Vietnamese", () => {
		expect(
			chapterSchema.safeParse({
				nameEn: "",
				nameVi: "Chương 1",
				courseId: "0b7c4bde-5d2a-4f2c-9c34-7d0f5a1d2b3c",
			}).success,
		).toBe(true);
	});

	it("rejects a lesson without a name in either language", () => {
		const result = lessonSchema.safeParse({
			nameEn: "",
			nameVi: "",
			courseId: "0b7c4bde-5d2a-4f2c-9c34-7d0f5a1d2b3c",
			chapterId: "1b7c4bde-5d2a-4f2c-9c34-7d0f5a1d2b3c",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(["nameEn"]);
	});
});

describe("slugSource", () => {
	it("uses the Vietnamese title when there is no English title", () => {
		expect(slugSource("", "Khóa học AI")).toBe("Khóa học AI");
	});

	it("prefers the English title", () => {
		expect(slugSource("AI course", "Khóa")).toBe("AI course");
	});
});
