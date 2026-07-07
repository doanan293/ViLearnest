import { arcjetModeSchema } from "@/lib/env-schema";

describe("arcjetModeSchema", () => {
	it("accepts dry-run mode", () => {
		expect(arcjetModeSchema.parse("DRY_RUN")).toBe("DRY_RUN");
	});

	it("accepts live mode", () => {
		expect(arcjetModeSchema.parse("LIVE")).toBe("LIVE");
	});

	it("rejects invalid mode", () => {
		expect(() => arcjetModeSchema.parse("development")).toThrow();
	});
});
