import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CoverageEntry,
  collectRegisteredRoutes,
  parseBrunoRequests,
  renderCoverageReport,
  type ScenarioEvidence,
  validateCoverage,
} from "./coverage.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const inventory = JSON.parse(await readFile(join(root, "bruno/coverage/inventory.json"), "utf8")) as CoverageEntry[];
const requests = await parseBrunoRequests(join(root, "bruno"));
const routes = await collectRegisteredRoutes();
const errors = validateCoverage(routes, requests, inventory);
for (const scenario of inventory
  .flatMap((entry) => entry.scenarios)
  .filter((scenario) => scenario.layer === "backend")) {
  for (const file of scenario.files) {
    try {
      await access(join(root, file));
    } catch {
      errors.push(`backend scenario ${scenario.id} references missing file ${file}`);
    }
  }
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  const evidenceArg = process.argv.indexOf("--evidence");
  const evidence: ScenarioEvidence =
    evidenceArg < 0 ? {} : JSON.parse(await readFile(process.argv[evidenceArg + 1], "utf8"));
  await writeFile(join(root, "docs/testing/bruno-business-coverage.md"), renderCoverageReport(inventory, evidence));
  console.log(
    `Coverage inventory valid: ${routes.length} registered routes, ${inventory.filter((entry) => !entry.exclusion).length} product/delegated operations. Execution evidence is ${evidenceArg < 0 ? "not-run" : "supplied separately"}.`
  );
}
