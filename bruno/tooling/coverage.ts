import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseRequest } from "@usebruno/filestore";
import type { onRouteHookHandler } from "fastify";
import { build } from "../../backend/src/build-app.js";
import { client } from "../../backend/src/db/index.js";

export type RouteEntry = { method: string; path: string };
export type Scenario = { id: string; layer: "bruno" | "backend"; files: string[]; purpose: string };
export type CoverageEntry = {
  route: RouteEntry;
  access: "public" | "session" | "admin" | "signature" | "helper";
  scenarios: Scenario[];
  exclusion?: string;
};
export type ParsedBrunoRequest = RouteEntry & { file: string; url: string; expectedStatuses: number[]; actor?: string };
export type ScenarioEvidence = Record<string, "passed" | "failed" | "not-run">;

export async function collectRegisteredRoutes(): Promise<RouteEntry[]> {
  const routes: RouteEntry[] = [];
  const onRoute: onRouteHookHandler = (options) => {
    const methods = Array.isArray(options.method) ? options.method : [options.method];
    for (const method of methods) routes.push({ method: method.toUpperCase(), path: options.url });
  };
  const app = await build({ logger: false }, { onRoute });
  try {
    await app.ready();
    return uniqueRoutes(routes);
  } finally {
    await app.close();
    await client.end();
  }
}

export async function parseBrunoRequests(root: string): Promise<ParsedBrunoRequest[]> {
  const files = await listFiles(root);
  const requests: ParsedBrunoRequest[] = [];
  for (const absolutePath of files.filter(
    (file) => file.endsWith(".bru") && !/(?:^|\/)(?:folder|collection)\.bru$/.test(file)
  )) {
    const content = await readFile(absolutePath, "utf8");
    let parsed: {
      type?: string;
      request?: {
        method?: string;
        url?: string;
        tests?: string;
        vars?: { req?: { name: string; value: string; enabled?: boolean }[] };
      };
    };
    try {
      parsed = parseRequest(content, { format: "bru" });
    } catch (error) {
      throw new Error(`Could not parse Bruno request ${relative(root, absolutePath)}: ${String(error)}`);
    }
    if (parsed.type !== "http-request" || !parsed.request?.method || !parsed.request?.url) continue;
    const tests = parsed.request.tests ?? "";
    const statusMatches = [...tests.matchAll(/res\.status\s*\)\s*\.to\.(?:equal|equals)\(\s*(\d{3})\s*\)/g)];
    requests.push({
      file: relative(root, absolutePath).split(sep).join("/"),
      method: String(parsed.request.method).toUpperCase(),
      path: requestPath(parsed.request.url),
      url: parsed.request.url,
      expectedStatuses: statusMatches.map((match) => Number(match[1])),
      actor: parsed.request.vars?.req?.find((variable) => variable.name === "actor" && variable.enabled !== false)
        ?.value,
    });
  }
  return requests.sort((left, right) => left.file.localeCompare(right.file));
}

export function validateCoverage(
  routes: RouteEntry[],
  requests: ParsedBrunoRequest[],
  inventory: CoverageEntry[]
): string[] {
  const errors: string[] = [];
  const routeMap = new Map(inventory.map((entry) => [routeKey(entry.route), entry]));
  const normalizedActual = new Set(routes.map((route) => routeKey(normalizeRoute(route))));

  for (const route of routes) {
    const key = routeKey(normalizeRoute(route));
    if (!routeMap.has(key)) errors.push(`registered route ${key} is missing from inventory`);
  }

  for (const entry of inventory) {
    const route = normalizeRoute(entry.route);
    const key = routeKey(route);
    const isRegistered = normalizedActual.has(key) || isDelegatedAuthRoute(route, routes);
    if (!entry.exclusion && !isRegistered) errors.push(`inventory route ${key} is not registered`);
    if (entry.exclusion !== undefined && !entry.exclusion.trim())
      errors.push(`excluded route ${key} needs an explicit reason`);
    if (entry.exclusion) continue;
    if (entry.scenarios.length === 0) errors.push(`product route ${key} has no scenarios`);

    for (const scenario of entry.scenarios) {
      for (const file of scenario.files) {
        if (scenario.layer === "backend") continue;
        const matches = requests.filter((request) => request.file === file);
        if (matches.length === 0) {
          errors.push(`inventory scenario ${scenario.id} references missing request ${file}`);
          continue;
        }
        if (!matches.some((request) => requestMatchesRoute(request, route))) {
          const wrongMethod = matches.find((request) => requestPathMatches(request.path, route.path));
          if (wrongMethod) {
            errors.push(`scenario ${scenario.id} uses ${wrongMethod.method} for ${key}`);
          } else {
            errors.push(`scenario ${scenario.id} request ${file} does not match ${key}`);
          }
        }
      }
    }

    const declaredFiles = entry.scenarios
      .filter((scenario) => scenario.layer === "bruno")
      .flatMap((scenario) => scenario.files);
    const declaredRequests = requests.filter((request) => declaredFiles.includes(request.file));
    // Better Auth delegated endpoints intentionally use 200/null or an error envelope for anonymous sessions.
    if (["session", "admin"].includes(entry.access) && route.path.startsWith("/api/v1/")) {
      if (!declaredRequests.some((request) => request.actor === "anonymous" && request.expectedStatuses.includes(401)))
        errors.push(`protected route ${key} has no anonymous 401 scenario`);
    }
    if (
      entry.access === "admin" &&
      !declaredRequests.some(
        (request) => ["learnerA", "learnerB"].includes(request.actor || "") && request.expectedStatuses.includes(403)
      )
    )
      errors.push(`admin route ${key} has no authenticated learner 403 scenario`);

    if (entry.access === "public") {
      const brunoFiles = entry.scenarios
        .filter((scenario) => scenario.layer === "bruno")
        .flatMap((scenario) => scenario.files);
      const publicResponses = requests.filter((request) => brunoFiles.includes(request.file));
      const backendSuccess = entry.scenarios.some(
        (scenario) => scenario.layer === "backend" && !/401|unauthorized|unauthenticated/i.test(scenario.purpose)
      );
      const brunoSuccess = publicResponses.some((request) =>
        request.expectedStatuses.some((status) => status >= 200 && status < 300)
      );
      if (!backendSuccess && !brunoSuccess) {
        errors.push(`public route ${key} has no successful scenario; 401-only coverage is insufficient`);
      }
    }
  }

  return [...new Set(errors)].sort();
}

export function renderCoverageReport(inventory: CoverageEntry[], evidence: ScenarioEvidence = {}) {
  const rows = inventory
    .slice()
    .sort((left, right) => routeKey(left.route).localeCompare(routeKey(right.route)))
    .map((entry) => {
      const scenarios = entry.exclusion
        ? `Excluded: ${entry.exclusion}`
        : entry.scenarios
            .map((scenario) => `${scenario.id} (${scenario.layer}; ${evidence[scenario.id] ?? "not-run"})`)
            .join("<br>");
      return `| \`${entry.route.method.toUpperCase()} ${entry.route.path}\` | ${entry.access} | ${scenarios} |`;
    });
  return [
    "# Bruno business coverage",
    "",
    "This report separates declared scenario coverage from observed execution. A `not-run` status means no run evidence was supplied to the generator.",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "| Registered operation | Access | Scenarios and last supplied execution evidence |",
    "| --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export function routeKey(route: RouteEntry) {
  return `${route.method.toUpperCase()} ${normalizePath(route.path)}`;
}

async function listFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !["environments", "node_modules", ".git", "reports"].includes(entry.name))
      .map((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? listFiles(root, path) : [path];
      })
  );
  return nested.flat();
}

function requestPath(url: string) {
  const substituted = url.replace(/^\{\{[^}]+\}\}/, "http://bruno.local").replace(/\{\{([^}]+)\}\}/g, ":$1");
  return new URL(substituted, "http://bruno.local").pathname;
}

function normalizeRoute(route: RouteEntry): RouteEntry {
  return { method: route.method.toUpperCase(), path: normalizePath(route.path) };
}

function normalizePath(path: string) {
  const withoutTrailingSlash = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return withoutTrailingSlash.replace(/\{([^}]+)\}/g, ":$1").replace(/\{\{([^}]+)\}\}/g, ":$1");
}

function requestMatchesRoute(request: RouteEntry, route: RouteEntry) {
  return request.method.toUpperCase() === route.method.toUpperCase() && requestPathMatches(request.path, route.path);
}

function requestPathMatches(requestPathValue: string, routePathValue: string) {
  const request = normalizePath(requestPathValue).split("/");
  const route = normalizePath(routePathValue).split("/");
  if (route.at(-1) === "*") return request.slice(0, -1).join("/") === route.slice(0, -1).join("/");
  return (
    request.length === route.length &&
    route.every((segment, index) => segment.startsWith(":") || segment === request[index])
  );
}

function isDelegatedAuthRoute(route: RouteEntry, actualRoutes: RouteEntry[]) {
  return (
    route.path.startsWith("/api/auth/") &&
    actualRoutes.some((actual) => actual.method === route.method && actual.path === "/api/auth/*")
  );
}

function uniqueRoutes(routes: RouteEntry[]) {
  const unique = new Map(routes.map((route) => [routeKey(route), normalizeRoute(route)]));
  return [...unique.values()].sort((left, right) => routeKey(left).localeCompare(routeKey(right)));
}
