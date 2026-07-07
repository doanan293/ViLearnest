import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const sourceRoots = ["src"];

function walk(dir: string): Array<string> {
	return readdirSync(dir).flatMap((entry) => {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			return walk(fullPath);
		}
		return /\.(ts|tsx)$/.test(fullPath) ? [fullPath] : [];
	});
}

describe("runtime router refresh usage", () => {
	it("does not call router.refresh in frontend runtime source", () => {
		const projectRoot = process.cwd();
		const files = sourceRoots.flatMap((root) => walk(join(projectRoot, root)));
		const offenders = files.filter((file) =>
			readFileSync(file, "utf8").includes("router.refresh()"),
		);

		expect(offenders).toEqual([]);
	});

	it("documents router refresh as outside the query synchronization boundary", () => {
		const guidelines = readFileSync(
			join(process.cwd(), "src", "lib", "query-guidelines.md"),
			"utf8",
		);

		expect(guidelines).toContain(
			"Do not use `router.refresh()` as a mutation synchronization mechanism.",
		);
	});
});
