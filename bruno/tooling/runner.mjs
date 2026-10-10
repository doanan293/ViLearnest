import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const SUITE_FOLDERS = {
  system: "01-system",
  auth: "02-auth",
  profile: "03-profile",
  "public-courses": "04-public-courses",
  "admin-courses": "05-admin-courses",
  "learning-access": "06-learning-access",
  payment: "07-payment",
  storage: "08-storage",
};
export const CORE_SUITES = Object.keys(SUITE_FOLDERS).slice(0, 6);
export const SMOKE_REQUESTS = [
  "01-system/health.bru",
  "01-system/openapi-json.bru",
  "01-system/public-courses.bru",
  "03-profile/30-PROFILE-admin-anon-list.bru",
];

export function selectSuites(selection = "all") {
  if (selection === "core") return [...CORE_SUITES];
  if (selection === "all") return Object.keys(SUITE_FOLDERS);
  if (selection === "smoke") return ["smoke"];
  const suites = selection.split(",");
  if (suites.some((suite) => !SUITE_FOLDERS[suite])) throw new Error("Unknown Bruno suite selection");
  return suites;
}

export function redactReport(raw) {
  const results = (Array.isArray(raw) ? raw : [raw]).flatMap((iteration) =>
    Array.isArray(iteration?.results) ? iteration.results : []
  );
  return {
    requests: results.map((result) => ({
      file:
        typeof result.test?.filename === "string" && /^[a-zA-Z0-9_./-]+\.bru$/.test(result.test.filename)
          ? result.test.filename
          : "[redacted]",
      outcome:
        ["fail", "error"].includes(result.status) ||
        ["testResults", "assertionResults", "preRequestTestResults", "postResponseTestResults"].some((key) =>
          (result[key] || []).some((test) => test.status === "fail")
        )
          ? "failed"
          : result.status === "pass"
            ? "passed"
            : "not-run",
      httpStatus: typeof result.response?.status === "number" ? result.response.status : null,
      tests: {
        passed: (result.testResults || []).filter((test) => test.status === "pass").length,
        failed: (result.testResults || []).filter((test) => test.status === "fail").length,
      },
      assertions: {
        passed: (result.assertionResults || []).filter((assertion) => assertion.status === "pass").length,
        failed: (result.assertionResults || []).filter((assertion) => assertion.status === "fail").length,
      },
    })),
  };
}

export async function cleanupRun(
  ref,
  { helperUrl = "http://127.0.0.1:5001", helperToken = "", timeoutMs = 5000 } = {}
) {
  const response = await fetch(`${helperUrl}/api/v1/bruno-desktop/runs/cleanup`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bruno-helper-token": helperToken },
    body: JSON.stringify(ref),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Helper cleanup failed (HTTP ${response.status})`);
  const result = await response.json();
  if (!Array.isArray(result.remaining) || !Array.isArray(result.retained))
    throw new Error("Helper cleanup result is invalid");
  return result;
}

export function runProcess({ executable, args, cwd, env, signal }) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(executable, args, { cwd, env, stdio: ["ignore", "ignore", "ignore"] });
    let killTimer;
    const interrupt = () => {
      child.kill("SIGINT");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
      killTimer.unref();
    };
    signal?.addEventListener("abort", interrupt, { once: true });
    if (signal?.aborted) interrupt();
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(killTimer);
      signal?.removeEventListener("abort", interrupt);
      resolveResult({ exitCode: code ?? (signal?.aborted ? 130 : 1) });
    });
  });
}

export async function runSuites(options, injected = {}) {
  const {
    suites,
    baseUrl = "http://localhost:5000",
    helperUrl = "http://127.0.0.1:5001",
    env = "local",
    helperToken = "",
    signal,
  } = options;
  const collectionDir = options.collectionDir || join(root, "bruno");
  const reportDir = options.reportDir || join(root, ".bruno-reports");
  const deps = {
    runProcess,
    cleanupRun,
    readReport: async (path) => JSON.parse(await readFile(path, "utf8")),
    writeReport: async (path, value) => {
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    },
    ...injected,
  };
  const results = [];
  let exitCode = 0;
  for (const suite of suites) {
    if (signal?.aborted) {
      results.push({ suite, outcome: "not-run", cleanupRemaining: [], retained: [] });
      exitCode ||= 130;
      continue;
    }
    const stateful = !["system", "smoke"].includes(suite);
    const runRef = stateful ? { runId: randomUUID(), suite } : undefined;
    const targets = suite === "smoke" ? SMOKE_REQUESTS : [SUITE_FOLDERS[suite]];
    if (targets.some((target) => !target)) throw new Error(`Unknown suite: ${suite}`);
    const temporary = await mkdtemp(join(tmpdir(), "andv-bruno-"));
    const rawPath = join(temporary, "raw.json");
    await writeFile(rawPath, "", { mode: 0o600 });
    const args = [
      join(root, "node_modules/@usebruno/cli/bin/bru.js"),
      "run",
      ...targets,
      "--env",
      env,
      "--disable-cookies",
      "--bail",
      "--reporter-json",
      rawPath,
      "--reporter-skip-all-headers",
      "--reporter-skip-body",
      "--env-var",
      `baseUrl=${baseUrl}`,
      "--env-var",
      `helperUrl=${helperUrl}`,
    ];
    if (runRef) args.push("--env-var", `runId=${runRef.runId}`);
    let primaryCode = 1;
    let report = { requests: [] };
    let cleanupRemaining = [];
    let retained = [];
    let recovery;
    try {
      const processResult = await deps.runProcess({
        executable: process.execPath,
        args,
        cwd: collectionDir,
        env: { ...process.env, BRUNO_DESKTOP_HELPER_TOKEN: helperToken },
        signal,
      });
      primaryCode = processResult.exitCode || (signal?.aborted ? 130 : 0);
      try {
        report = redactReport(await deps.readReport(rawPath));
      } catch {
        primaryCode ||= 1;
      }
      if (!report.requests.length || report.requests.some((request) => request.outcome === "failed")) primaryCode ||= 1;
    } catch {
      primaryCode = signal?.aborted ? 130 : 1;
    } finally {
      if (runRef) {
        try {
          const cleanup = await deps.cleanupRun(runRef, { helperUrl, helperToken, timeoutMs: 5000 });
          cleanupRemaining = cleanup.remaining;
          retained = cleanup.retained;
        } catch {
          cleanupRemaining = ["cleanup-unverified"];
        }
        if (cleanupRemaining.length || signal?.aborted)
          recovery = `npm run test:api:cleanup -- --run-id ${runRef.runId} --suite ${suite} --env ${env}`;
      }
      await rm(temporary, { recursive: true, force: true });
    }
    const outcome = primaryCode === 0 && !cleanupRemaining.length ? "passed" : "failed";
    exitCode ||= primaryCode || (cleanupRemaining.length ? 1 : 0);
    const result = { suite, runRef, outcome, cleanupRemaining, retained, recovery, report };
    results.push(result);
    try {
      await deps.writeReport(join(reportDir, `${suite}-${runRef?.runId || randomUUID()}.json`), {
        version: 1,
        date: new Date().toISOString(),
        cliVersion: "3.5.0",
        command: `bru run ${targets.join(" ")} --env ${env} --disable-cookies --bail`,
        ...result,
      });
    } catch {
      result.reportWriteFailed = true;
      result.outcome = "failed";
      exitCode ||= 1;
    }
  }
  return { exitCode, results };
}
