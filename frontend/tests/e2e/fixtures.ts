import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { type BrowserContext, test as base, expect } from "@playwright/test";

export type Actor = { id: string; email: string; password: string };
export type BrowserFixtures = {
	scope: string;
	actors: Record<"admin" | "learnerA" | "learnerB", Actor>;
	ids: Record<string, string>;
};
const execute = promisify(execFile);
const root = resolve(__dirname, "../../..");
const cli = resolve(root, "backend/tests/support/e2e-fixtures.ts");
async function fixtureCommand(action: string, scope: string) {
	return execute(process.execPath, ["--import", "tsx", cli, action, "--scope", scope], {
		cwd: root,
		env: process.env,
	});
}
export const test = base.extend<{ lms: BrowserFixtures }>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring for fixtures without dependencies.
	lms: async ({}, use) => {
		const scope = randomUUID();
		try {
			const { stdout } = await fixtureCommand("setup", scope);
			await use(JSON.parse(stdout) as BrowserFixtures);
		} finally {
			await fixtureCommand("cleanup", scope);
		}
	},
});
export { expect };
export async function signIn(context: BrowserContext, actor: Actor) {
	const response = await context.request.post("http://localhost:5002/api/auth/sign-in/email", {
		headers: { origin: "http://localhost:3002" },
		data: { email: actor.email, password: actor.password },
	});
	expect(response.status()).toBe(200);
}
