import { pickLocalized } from "@/lib/localized-text";

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
