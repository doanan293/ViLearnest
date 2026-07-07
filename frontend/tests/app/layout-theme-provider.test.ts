import { readFileSync } from "node:fs";
import { join } from "node:path";

const appDir = join(process.cwd(), "src", "app");

describe("theme provider layout placement", () => {
	it("keeps ThemeProvider in the app root instead of the locale layout", () => {
		const rootLayout = readFileSync(join(appDir, "layout.tsx"), "utf8");
		const localeLayout = readFileSync(join(appDir, "[locale]", "layout.tsx"), "utf8");

		expect(rootLayout).toContain("<ThemeProvider");
		expect(rootLayout).toContain("<html");
		expect(rootLayout).toContain("<body");

		expect(localeLayout).not.toContain("<ThemeProvider");
		expect(localeLayout).not.toContain("<html");
		expect(localeLayout).not.toContain("<body");
	});
});
