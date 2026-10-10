import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const validation = spawnSync(
	process.execPath,
	[
		"--import",
		"tsx",
		resolve(root, "backend/tests/support/e2e-fixtures.ts"),
		"validate",
		"--scope",
		"123e4567-e89b-42d3-a456-426614174000",
	],
	{ env: process.env, encoding: "utf8" },
);
if (validation.status !== 0)
	throw new Error(validation.stderr.trim() || "Isolated test database configuration required");
const databaseUrl = process.env.TEST_DATABASE_URL;
const env = {
	...process.env,
	TEST_DATABASE_URL: databaseUrl,
	DATABASE_URL: databaseUrl,
	ARCJET_MODE: "DRY_RUN",
	ARCJET_ENV: "development",
	ARCJET_KEY: "ajkey_mock",
	API_BASE_URL: "http://localhost:5002",
	PUBLIC_API_URL: "http://localhost:5002",
	INTERNAL_API_URL: "http://localhost:5002",
	FRONTEND_URL: "http://localhost:3002",
	BETTER_AUTH_SECRET: "lms-e2e-local-only-secret-at-least-32-characters",
	AUTH_COOKIE_SECURE: "false",
	NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: "lms-e2e-unused",
};
let active;
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
	process.on(signal, () => {
		stopping = true;
		if (active?.pid) active.kill(signal);
	});
async function run(args, cwd, childEnv) {
	const child = spawn(process.execPath, args, {
		cwd,
		env: childEnv,
		stdio: "inherit",
	});
	active = child;
	const code = await new Promise((resolveExit, reject) => {
		child.once("error", reject);
		child.once("exit", (exitCode, signal) => resolveExit(exitCode ?? (signal ? 1 : 0)));
	});
	active = undefined;
	if (code !== 0 && !stopping) throw new Error(`E2E server process exited with status ${code}`);
	return !stopping;
}
async function main() {
	if (process.argv[2] === "backend") {
		await run(["--import", "tsx", "src/index.ts"], resolve(root, "backend"), {
			...env,
			NODE_ENV: "test",
			PORT: "5002",
		});
	} else if (process.argv[2] === "frontend") {
		const next = resolve(root, "node_modules/next/dist/bin/next");
		const cwd = resolve(root, "frontend");
		if (await run([next, "build", "--webpack"], cwd, { ...env, NODE_ENV: "production" })) {
			await run([next, "start", "-p", "3002", "-H", "localhost"], cwd, {
				...env,
				NODE_ENV: "production",
			});
		}
	} else throw new Error("Choose backend or frontend");
}
main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
