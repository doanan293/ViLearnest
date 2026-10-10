import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type CoverageEntry, parseBrunoRequests, type RouteEntry, validateCoverage } from "../tooling/coverage.js";

const productRoute: RouteEntry = { method: "GET", path: "/api/v1/courses/:courseId/" };
const publicScenario: CoverageEntry = {
  route: productRoute,
  access: "public",
  scenarios: [
    {
      id: "course-detail",
      layer: "bruno",
      files: ["courses/01-course.bru"],
      purpose: "public course detail is available",
    },
  ],
};

describe("executable Bruno coverage inventory", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "bruno-coverage-"));
    await mkdir(join(root, "courses"));
  });

  afterEach(async () => rm(root, { recursive: true, force: true }));

  async function request(file: string, content: string) {
    await writeFile(join(root, "courses", file), content);
  }

  it("uses Bruno's pinned parser to read method and URL from requests", async () => {
    await request("01-course.bru", "get {\n  url: {{baseUrl}}/api/v1/courses/{{courseId}}/\n}\n");
    await expect(parseBrunoRequests(root)).resolves.toEqual([
      expect.objectContaining({
        file: "courses/01-course.bru",
        method: "GET",
        url: "{{baseUrl}}/api/v1/courses/{{courseId}}/",
      }),
    ]);
  });

  it("finds a newly registered product route missing from the inventory", () => {
    const errors = validateCoverage(
      [...[productRoute], { method: "POST", path: "/api/v1/new-business-operation" }],
      [],
      [publicScenario]
    );
    expect(errors).toContain("registered route POST /api/v1/new-business-operation is missing from inventory");
  });

  it("rejects inventory references to stale Bruno request files", () => {
    const stale = { ...publicScenario, scenarios: [{ ...publicScenario.scenarios[0], files: ["missing.bru"] }] };
    expect(validateCoverage([productRoute], [], [stale])).toContain(
      "inventory scenario course-detail references missing request missing.bru"
    );
  });

  it("reports a wrong HTTP method even when the request path matches", async () => {
    await request("01-course.bru", "post {\n  url: {{baseUrl}}/api/v1/courses/{{courseId}}/\n}\n");
    const parsed = await parseBrunoRequests(root);
    expect(validateCoverage([productRoute], parsed, [publicScenario])).toContain(
      "scenario course-detail uses POST for GET /api/v1/courses/:courseId"
    );
  });

  it("matches parameter names and trailing slashes consistently", async () => {
    await request(
      "01-course.bru",
      'get {\n  url: {{baseUrl}}/api/v1/courses/{{id}}\n}\ntests {\n test("success", function() { expect(res.status).to.equal(200); });\n}\n'
    );
    const errors = validateCoverage([productRoute], await parseBrunoRequests(root), [publicScenario]);
    expect(errors).toEqual([]);
  });

  it("requires a successful scenario for public routes instead of accepting only a 401 check", async () => {
    await request(
      "01-course.bru",
      'get {\n  url: {{baseUrl}}/api/v1/courses/{{id}}\n}\ntests {\n  test("anonymous unauthorized", function() { expect(res.status).to.equal(401); });\n}\n'
    );
    const negativeOnly = {
      ...publicScenario,
      scenarios: [{ ...publicScenario.scenarios[0], purpose: "401 anonymous request is rejected" }],
    };
    const errors = validateCoverage([productRoute], await parseBrunoRequests(root), [negativeOnly]);
    expect(errors).toContain(
      "public route GET /api/v1/courses/:courseId has no successful scenario; 401-only coverage is insufficient"
    );
  });

  it("requires explicit reasons for generated, helper and OAuth exclusions", () => {
    const excluded: CoverageEntry[] = [
      {
        route: { method: "GET", path: "/docs/json" },
        access: "public",
        scenarios: [],
        exclusion: "Swagger UI generated route",
      },
      {
        route: { method: "POST", path: "/api/v1/bruno-desktop/runs/setup" },
        access: "helper",
        scenarios: [],
        exclusion: "test-only fixture helper",
      },
      {
        route: { method: "POST", path: "/api/auth/sign-in/social" },
        access: "session",
        scenarios: [],
        exclusion: "OAuth provider flow is not configured by this product",
      },
    ];
    expect(
      validateCoverage(
        excluded.map((entry) => entry.route),
        [],
        excluded
      )
    ).toEqual([]);
    expect(
      validateCoverage(
        excluded.map((entry) => entry.route),
        [],
        excluded.map((entry) => ({ ...entry, exclusion: "" }))
      )
    ).toEqual(
      expect.arrayContaining([
        "excluded route GET /docs/json needs an explicit reason",
        "excluded route POST /api/v1/bruno-desktop/runs/setup needs an explicit reason",
        "excluded route POST /api/auth/sign-in/social needs an explicit reason",
      ])
    );
  });
});

it("requires anonymous 401 and authenticated learner 403 checks separately for admin routes", () => {
  const route = { method: "GET", path: "/api/v1/admin/courses" };
  const inventory: CoverageEntry[] = [
    {
      route,
      access: "admin",
      scenarios: [{ id: "denied", layer: "bruno", files: ["denied.bru"], purpose: "learner denied" }],
    },
  ];
  const request = { ...route, file: "denied.bru", url: route.path, expectedStatuses: [403], actor: "learnerA" };
  expect(validateCoverage([route], [request], inventory)).toContain(
    "protected route GET /api/v1/admin/courses has no anonymous 401 scenario"
  );
  expect(validateCoverage([route], [{ ...request, expectedStatuses: [401], actor: "anonymous" }], inventory)).toContain(
    "admin route GET /api/v1/admin/courses has no authenticated learner 403 scenario"
  );
});
