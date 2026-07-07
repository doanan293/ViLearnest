import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ux performance audit documentation", () => {
	it("documents build, Web Vitals, bundle, and render review steps", () => {
		const doc = readFileSync(
			join(process.cwd(), "..", "docs", "performance", "ux-performance-audit.md"),
			"utf8",
		);

		expect(doc).toContain("npm run build -w frontend");
		expect(doc).toContain("Speed Insights");
		expect(doc).toContain("LCP");
		expect(doc).toContain("INP");
		expect(doc).toContain("CLS");
		expect(doc).toContain("client bundle");
		expect(doc).toContain("render");
	});
});
