import { displayTitle, pickLocalized } from "@/lib/localized-text";

describe("pickLocalized", () => {
	it("returns the admin's language", () => {
		expect(pickLocalized({ titleEn: "AI Fast", titleVi: "AI Nhanh" }, "title", "vi")).toBe(
			"AI Nhanh",
		);
	});

	it("falls back to the other language", () => {
		expect(
			pickLocalized(
				{ smallDescriptionEn: "", smallDescriptionVi: "Ngắn" },
				"smallDescription",
				"en",
			),
		).toBe("Ngắn");
	});

	it("returns null when neither language has text", () => {
		expect(
			pickLocalized({ descriptionEn: null, descriptionVi: null }, "description", "vi"),
		).toBeNull();
	});
});

describe("displayTitle", () => {
	it("shows the title in the admin's language", () => {
		expect(
			displayTitle({ title: "Chapter 1", titleEn: "Chapter 1", titleVi: "Chương 1" }, "vi"),
		).toBe("Chương 1");
	});

	it("keeps the server title for rows without language columns", () => {
		expect(displayTitle({ title: "Chapter 1" }, "vi")).toBe("Chapter 1");
	});
});
