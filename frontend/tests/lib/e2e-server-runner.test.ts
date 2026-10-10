/** @jest-environment node */
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repo = resolve(__dirname, "../../..");

async function waitFor<T>(read: () => Promise<T | undefined>, timeout = 8_000): Promise<T> {
	const until = Date.now() + timeout;
	while (Date.now() < until) {
		const value = await read();
		if (value !== undefined) return value;
		await new Promise((done) => setTimeout(done, 50));
	}
	throw new Error("Timed out waiting for E2E server process");
}

function running(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

it("does not leave the backend server alive when the runner's process group is killed", async () => {
	const root = await mkdtemp(join(tmpdir(), "lms-e2e-runner-"));
	const runner = join(root, "frontend/tests/e2e/run-server.mjs");
	const validator = join(root, "backend/tests/support/e2e-fixtures.ts");
	const server = join(root, "backend/src/index.ts");
	const marker = join(root, "server.pid");
	let serverPid: number | undefined;
	let runnerPid: number | undefined;
	try {
		for (const file of [runner, validator, server]) await mkdir(dirname(file), { recursive: true });
		await copyFile(join(repo, "frontend/tests/e2e/run-server.mjs"), runner);
		await writeFile(validator, "process.exit(0);\n");
		await writeFile(
			server,
			'import { writeFileSync } from "node:fs"; writeFileSync(process.env.PID_MARKER!, String(process.pid)); setInterval(() => {}, 1000);\n',
		);
		await symlink(join(repo, "node_modules"), join(root, "node_modules"), "dir");
		const child = spawn(process.execPath, ["--import", "tsx", runner, "backend"], {
			cwd: join(root, "frontend"),
			detached: true,
			stdio: "ignore",
			env: {
				...process.env,
				TEST_DATABASE_URL: "postgres://localhost/lms_test",
				PID_MARKER: marker,
			},
		});
		runnerPid = child.pid;
		const launchedPid = await waitFor(async () => {
			try {
				return Number(await readFile(marker, "utf8"));
			} catch {
				return undefined;
			}
		});
		serverPid = launchedPid;
		if (!runnerPid) throw new Error("Runner did not start");
		process.kill(-runnerPid, "SIGKILL");
		await waitFor(async () => (running(launchedPid) ? undefined : true), 3_000);
	} finally {
		if (runnerPid) {
			try {
				process.kill(-runnerPid, "SIGKILL");
			} catch {}
		}
		if (serverPid) {
			try {
				process.kill(-serverPid, "SIGKILL");
			} catch {
				try {
					process.kill(serverPid, "SIGKILL");
				} catch {}
			}
		}
		await rm(root, { recursive: true, force: true });
	}
}, 15_000);
