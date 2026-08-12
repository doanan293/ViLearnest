import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("root package scripts", () => {
  it("exposes only public Bruno API workflow scripts", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "..", "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["test:api"]).toBe(
      "npm run db:seed-bruno-api --workspace=@andv-lms/backend && cd bruno && bru run --env local"
    );
    expect(packageJson.scripts?.["test:api:smoke"]).toBe(
      "cd bruno && bru run 01-system 02-auth-contract 03-public-courses 04-protected-routes 05-admin-routes 06-storage --env local"
    );
    expect(packageJson.scripts?.["test:api:workflows"]).toBe("node scripts/run-bruno-workflows.mjs");
    expect(packageJson.scripts?.["test:api:payment"]).toBe("node scripts/run-bruno-payment.mjs");
    expect(packageJson.scripts?.["test:api:edge"]).toBe("node scripts/run-bruno-edge-lifecycle.mjs");
    expect(packageJson.scripts?.["test:api:all"]).toBe(
      "npm run db:seed-bruno-api --workspace=@andv-lms/backend && cd bruno && bru run --env local"
    );
    expect(packageJson.scripts).not.toHaveProperty("test:api:seed");
    expect(packageJson.scripts).not.toHaveProperty("test:api:storage-env");
    expect(packageJson.scripts).not.toHaveProperty("test:api:payment-env");
  });

  it("keeps Bruno runner prerequisites self-contained", () => {
    const workflowsRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-workflows.mjs"), "utf8");
    const paymentRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-payment.mjs"), "utf8");
    const edgeRunner = readFileSync(join(process.cwd(), "..", "scripts", "run-bruno-edge-lifecycle.mjs"), "utf8");

    for (const runner of [workflowsRunner, paymentRunner, edgeRunner]) {
      expect(runner).not.toContain("test:api:seed");
      expect(runner).not.toContain("test:api:storage-env");
      expect(runner).not.toContain("test:api:payment-env");
      expect(runner).toContain('run("npm", ["run", "db:seed-bruno-api", "--workspace=@andv-lms/backend"]);');
    }

    expect(workflowsRunner).toContain(
      'run("npm", ["run", "bruno:check-storage-env", "--workspace=@andv-lms/backend"]);'
    );
    expect(paymentRunner).toContain('run("npm", ["run", "bruno:check-payment-env", "--workspace=@andv-lms/backend"]);');
  });
});
