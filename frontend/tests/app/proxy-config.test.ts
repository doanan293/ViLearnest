import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("proxy config", () => {
	it("excludes all API routes from locale middleware", () => {
		const proxy = readFileSync(join(process.cwd(), "src", "proxy.ts"), "utf8");

		expect(proxy).toContain("_next/static|_next/image|favicon.ico|api|.*\\\\..*");
		expect(proxy).not.toContain("api/auth|");
	});

	it("checks admin sessions through the backend session endpoint", () => {
		const proxy = readFileSync(join(process.cwd(), "src", "proxy.ts"), "utf8");

		expect(proxy).toContain("/api/auth/session");
		expect(proxy).not.toContain("/api/auth/get-session");
	});
});
