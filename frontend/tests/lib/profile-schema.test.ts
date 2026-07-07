import { profileSchema } from "@/lib/zodSchemas";

describe("profileSchema", () => {
	it("normalizes optional empty strings to null", () => {
		const result = profileSchema.parse({
			name: "An Nguyen",
			phoneNumber: "",
			facebookUrl: "",
		});

		expect(result.phoneNumber).toBeNull();
		expect(result.facebookUrl).toBeNull();
	});

	it("rejects future dates of birth", () => {
		expect(() => profileSchema.parse({ name: "An Nguyen", dateOfBirth: "2999-01-01" })).toThrow();
	});

	it("accepts only supported profile genders", () => {
		expect(profileSchema.parse({ name: "An Nguyen", gender: "Male" }).gender).toBe("Male");
		expect(profileSchema.parse({ name: "An Nguyen", gender: "Female" }).gender).toBe("Female");
		expect(() => profileSchema.parse({ name: "An Nguyen", gender: "Other" })).toThrow();
	});

	it("normalizes social links with missing protocol", () => {
		const result = profileSchema.parse({ name: "An Nguyen", githubUrl: "github.com/andv" });

		expect(result.githubUrl).toBe("https://github.com/andv");
	});
});
