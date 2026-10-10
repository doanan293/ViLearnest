import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type CoverageEntry,
  collectRegisteredRoutes,
  parseBrunoRequests,
  renderCoverageReport,
  validateCoverage,
} from "../tooling/coverage.js";

it("maps actual Fastify registrations and concrete auth operations to maintained scenario files", async () => {
  const inventory = JSON.parse(
    await readFile(join(process.cwd(), "bruno/coverage/inventory.json"), "utf8")
  ) as CoverageEntry[];
  const requests = await parseBrunoRequests(join(process.cwd(), "bruno"));
  const routes = await collectRegisteredRoutes();
  expect(routes).toContainEqual({ method: "POST", path: "/api/v1/courses/checkout/confirm" });
  expect(routes.some((route) => route.path.includes("bruno-desktop"))).toBe(false);
  expect(validateCoverage(routes, requests, inventory)).toEqual([]);
  for (const file of inventory
    .flatMap((entry) => entry.scenarios)
    .filter((scenario) => scenario.layer === "backend")
    .flatMap((scenario) => scenario.files)) {
    await expect(readFile(join(process.cwd(), file), "utf8")).resolves.toContain("it(");
  }
});

it("does not turn inventory presence into passing execution evidence", () => {
  const inventory: CoverageEntry[] = [
    {
      route: { method: "GET", path: "/api/v1/health" },
      access: "public",
      scenarios: [{ id: "health", layer: "bruno", files: ["01-system/health.bru"], purpose: "Health is available" }],
    },
  ];
  expect(renderCoverageReport(inventory)).toContain("health (bruno; not-run)");
  expect(renderCoverageReport(inventory, { health: "passed" })).toContain("health (bruno; passed)");
});
