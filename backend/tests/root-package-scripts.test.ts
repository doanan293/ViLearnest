import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("root package scripts", () => {
  it("exposes only public Bruno API workflow scripts", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "..", "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["test:api"]).toBe(
      "cd bruno && bru run system auth-contract public-courses protected-routes admin-routes storage --env local"
    );
    expect(packageJson.scripts?.["test:api:full"]).toBe("node scripts/run-bruno-phase-b.mjs");
    expect(packageJson.scripts?.["test:api:payment"]).toBe("node scripts/run-bruno-phase-c.mjs");
    expect(packageJson.scripts?.["test:api:coverage"]).toBe("node scripts/run-bruno-phase-d.mjs");
    expect(packageJson.scripts).not.toHaveProperty("test:api:seed");
    expect(packageJson.scripts).not.toHaveProperty("test:api:storage-env");
    expect(packageJson.scripts).not.toHaveProperty("test:api:payment-env");
  });

  it("keeps Bruno runner prerequisites self-contained", () => {
    const phaseBRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-phase-b.mjs"), "utf8");
    const phaseCRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-phase-c.mjs"), "utf8");
    const phaseDRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-phase-d.mjs"), "utf8");

    for (const runner of [phaseBRunner, phaseCRunner, phaseDRunner]) {
      expect(runner).not.toContain("test:api:seed");
      expect(runner).not.toContain("test:api:storage-env");
      expect(runner).not.toContain("test:api:payment-env");
      expect(runner).toContain('run("npm", ["run", "db:seed-bruno-api", "--workspace=@andv-lms/backend"]);');
    }

    expect(phaseBRunner).toContain('run("npm", ["run", "bruno:check-storage-env", "--workspace=@andv-lms/backend"]);');
    expect(phaseCRunner).toContain('run("npm", ["run", "bruno:check-payment-env", "--workspace=@andv-lms/backend"]);');
  });
});
