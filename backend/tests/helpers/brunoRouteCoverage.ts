import { readFileSync } from "node:fs";
import { join } from "node:path";

export type RouteEntry = {
  method: string;
  path: string;
  source: string;
};

const routeFiles = [
  { file: "backend/src/app.ts", prefix: "" },
  { file: "backend/src/routes/api/v1/index.ts", prefix: "/api/v1" },
  { file: "backend/src/routes/api/v1/auth.routes.ts", prefix: "/api/v1/auth" },
  { file: "backend/src/routes/api/v1/courses.routes.ts", prefix: "/api/v1/courses" },
  { file: "backend/src/routes/api/v1/profile.routes.ts", prefix: "/api/v1/profile" },
  { file: "backend/src/routes/api/v1/admin.routes.ts", prefix: "/api/v1/admin" },
  { file: "backend/src/routes/api/v1/admin-users.routes.ts", prefix: "/api/v1/admin/users" },
  { file: "backend/src/routes/api/v1/storage.routes.ts", prefix: "/api/v1/storage" },
  { file: "backend/src/routes/api/v1/webhook.routes.ts", prefix: "/api/v1/webhooks" },
  { file: "backend/src/routes/api/v1/bruno-desktop.routes.ts", prefix: "/api/v1/bruno-desktop" },
] as const;

const adapterRoutes: RouteEntry[] = [
  { method: "GET", path: "/api/auth/*", source: "backend/src/app.ts" },
  { method: "POST", path: "/api/auth/*", source: "backend/src/app.ts" },
];

export function collectFirstPartyRoutes(rootDir: string) {
  const sourceRoutes = routeFiles.flatMap(({ file, prefix }) => {
    const sourceText = readFileSync(join(rootDir, file), "utf8");
    return extractRouteCalls(sourceText, file, prefix);
  });

  return uniqueRoutes([...sourceRoutes, ...adapterRoutes]);
}

export function parseCoverageAuditRoutes(markdown: string) {
  const routes: RouteEntry[] = [];

  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 2 || cells[0] === "Method" || cells[0].startsWith("---")) {
      continue;
    }

    const methods = cells[0].split("/").map((method) => method.trim().toUpperCase());
    const path = cells[1].replaceAll("`", "");

    for (const method of methods) {
      routes.push({ method, path, source: "docs/testing/bruno-api-coverage.md" });
    }
  }

  return uniqueRoutes(routes);
}

export function findUndocumentedRoutes(actualRoutes: RouteEntry[], documentedRoutes: RouteEntry[]) {
  const documentedKeys = new Set(documentedRoutes.map(routeKey));
  return actualRoutes.filter((route) => !documentedKeys.has(routeKey(route)));
}

export function routeKey(route: RouteEntry) {
  return `${route.method.toUpperCase()} ${route.path}`;
}

function extractRouteCalls(sourceText: string, source: string, prefix: string) {
  const routes: RouteEntry[] = [];
  const matcher = /(?:app|fastify)\.(get|post|put|delete)\b/g;
  let match = matcher.exec(sourceText);

  while (match) {
    const method = match[1].toUpperCase();
    const callOpenIndex = findCallOpen(sourceText, matcher.lastIndex);
    if (callOpenIndex === -1) {
      match = matcher.exec(sourceText);
      continue;
    }

    const path = readFirstStringLiteral(sourceText, callOpenIndex + 1);
    if (path === null) {
      match = matcher.exec(sourceText);
      continue;
    }

    routes.push({ method, path: joinRoute(prefix, path), source });
    match = matcher.exec(sourceText);
  }

  return routes;
}

function findCallOpen(sourceText: string, startIndex: number) {
  let angleDepth = 0;
  let quote: string | null = null;

  for (let index = startIndex; index < sourceText.length; index += 1) {
    const character = sourceText[index];
    const previousCharacter = sourceText[index - 1];

    if (quote) {
      if (character === quote && previousCharacter !== "\\") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "<") {
      angleDepth += 1;
      continue;
    }

    if (character === ">") {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    if (character === "(" && angleDepth === 0) {
      return index;
    }
  }

  return -1;
}

function readFirstStringLiteral(sourceText: string, startIndex: number) {
  let index = startIndex;
  while (/\s/.test(sourceText[index])) {
    index += 1;
  }

  const quote = sourceText[index];
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    return null;
  }

  let value = "";
  for (index += 1; index < sourceText.length; index += 1) {
    const character = sourceText[index];
    if (character === quote && sourceText[index - 1] !== "\\") {
      return value;
    }
    value += character;
  }

  return null;
}

function joinRoute(prefix: string, path: string) {
  if (!prefix) {
    return path || "/";
  }

  if (path === "") {
    return prefix;
  }

  if (path === "/") {
    return `${prefix}/`;
  }

  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function uniqueRoutes(routes: RouteEntry[]) {
  const routeMap = new Map<string, RouteEntry>();
  for (const route of routes) {
    routeMap.set(routeKey(route), route);
  }
  return [...routeMap.values()].sort((left, right) => routeKey(left).localeCompare(routeKey(right)));
}
