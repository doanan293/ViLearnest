import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  collectFirstPartyRoutes,
  findUndocumentedRoutes,
  parseCoverageAuditRoutes,
  type RouteEntry,
  routeKey,
} from "./helpers/brunoRouteCoverage.js";

const rootDir = join(process.cwd(), "..");

describe("bruno route coverage audit", () => {
  it("detects undocumented routes from synthetic inputs", () => {
    const actualRoutes: RouteEntry[] = [{ method: "GET", path: "/api/v1/new-route", source: "synthetic" }];
    const documentedRoutes = parseCoverageAuditRoutes(`
| Method | Route | Route File | Bruno Coverage | Phase | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | \`/api/v1/health\` | \`backend/src/routes/api/v1/index.ts\` | \`system/health.bru\` | A | Covered | Backend health check. |
`);

    expect(findUndocumentedRoutes(actualRoutes, documentedRoutes).map(routeKey)).toEqual(["GET /api/v1/new-route"]);
  });

  it("collects representative first-party Fastify routes from backend source", () => {
    const routes = collectFirstPartyRoutes(rootDir).map(routeKey);

    expect(routes).toEqual(
      expect.arrayContaining([
        "GET /openapi.json",
        "GET /api/v1/health",
        "POST /api/v1/admin/courses",
        "GET /api/v1/admin/users/",
        "POST /api/v1/webhooks/stripe",
        "GET /api/auth/*",
        "POST /api/auth/*",
      ])
    );
  });

  it("documents every first-party backend route in the Bruno coverage audit", () => {
    const coverageAudit = readFileSync(join(rootDir, "docs/testing/bruno-api-coverage.md"), "utf8");
    const actualRoutes = collectFirstPartyRoutes(rootDir);
    const documentedRoutes = parseCoverageAuditRoutes(coverageAudit);
    const missingRoutes = findUndocumentedRoutes(actualRoutes, documentedRoutes);

    expect(missingRoutes.map(routeKey)).toEqual([]);
  });
});
