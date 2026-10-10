import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnvironment } from "@usebruno/filestore";
import { cleanupRun, runSuites, selectSuites } from "./runner.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}
export async function main(args = process.argv.slice(2)) {
  const selection = args[0] && !args[0].startsWith("--") ? args[0] : "all";
  const env = option(args, "--env", "local");
  const collectionDir = resolve(option(args, "--collection-dir", join(root, "bruno")));
  const environment = parseEnvironment(await readFile(join(collectionDir, "environments", `${env}.bru`), "utf8"), {
    format: "bru",
  });
  const variables = Object.fromEntries(
    environment.variables
      .filter((variable) => variable.enabled !== false)
      .map((variable) => [variable.name, variable.value])
  );
  const settings = {
    env,
    collectionDir,
    baseUrl: option(args, "--base-url", variables.baseUrl),
    helperUrl: option(args, "--helper-url", variables.helperUrl),
    helperToken: process.env.BRUNO_DESKTOP_HELPER_TOKEN || variables.brunoDesktopHelperToken,
    reportDir: resolve(option(args, "--report-dir", join(root, ".bruno-reports"))),
  };
  if (selection === "cleanup") {
    const runId = option(args, "--run-id");
    const suite = option(args, "--suite");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId || "") ||
      !selectSuites("all").includes(suite) ||
      suite === "system"
    )
      throw new Error("Cleanup requires a valid RunRef");
    const result = await cleanupRun({ runId, suite }, settings);
    console.log(
      `Cleanup ${suite}/${runId}: ${result.remaining.length} retryable resources; ${result.retained.length} retained provider history records.`
    );
    if (result.remaining.length) console.log(result.remaining.join("\n"));
    process.exitCode = result.remaining.length ? 1 : 0;
    return result;
  }
  const controller = new AbortController();
  const interrupt = () => {
    console.log("Stopping current suite and cleaning its owned run...");
    controller.abort();
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    const suites = selectSuites(selection);
    console.log(`Running Bruno: ${suites.join(", ")}`);
    const result = await runSuites({ ...settings, suites, signal: controller.signal });
    for (const suite of result.results) {
      console.log(
        `${suite.suite}: ${suite.outcome}; ${suite.report?.requests.length || 0} request results; cleanup remaining ${suite.cleanupRemaining.length}; retained history ${suite.retained.length}${suite.runRef ? `; run ${suite.runRef.runId}` : ""}`
      );
      for (const request of suite.report?.requests.filter((request) => request.outcome === "failed") || [])
        console.log(`  Failed: ${request.file}`);
      if (suite.recovery) console.log(`Recovery: ${suite.recovery}`);
    }
    await mkdir(settings.reportDir, { recursive: true, mode: 0o700 });
    await writeFile(
      join(settings.reportDir, "last-run.json"),
      `${JSON.stringify({ date: new Date().toISOString(), ...result }, null, 2)}\n`,
      { mode: 0o600 }
    );
    let evidence = {};
    try {
      evidence = JSON.parse(await readFile(join(settings.reportDir, "evidence.json"), "utf8"));
    } catch {}
    for (const suite of result.results)
      for (const request of suite.report?.requests || [])
        evidence[request.file.replace(/\.bru$/, "")] = request.outcome;
    await writeFile(join(settings.reportDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, {
      mode: 0o600,
    });
    process.exitCode = result.exitCode;
    return result;
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error("Bruno runner failed. Check the selected environment, helper availability and CLI configuration.");
    process.exitCode = 1;
  });
}
