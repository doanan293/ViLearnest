import { readFileSync } from "node:fs";
import { join } from "node:path";

const localeLayoutPath = join(process.cwd(), "src", "app", "[locale]", "layout.tsx");

describe("query provider layout placement", () => {
	it("wraps locale routes with QueryProvider inside NextIntlClientProvider", () => {
		const localeLayout = readFileSync(localeLayoutPath, "utf8");

		expect(localeLayout).toContain(
			'import { QueryProvider } from "@/components/providers/query-provider"',
		);
		expect(localeLayout).toMatch(
			/<NextIntlClientProvider messages=\{messages\}>\s*<QueryProvider>\{children\}<\/QueryProvider>\s*<\/NextIntlClientProvider>/,
		);
	});
});
