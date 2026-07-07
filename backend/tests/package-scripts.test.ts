import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("package scripts", () => {
  it("runs the backend dev server with the backend environment file", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.dev).toContain("--env-file=.env");
    expect(packageJson.scripts?.dev).not.toContain("ARCJET_ENV=development");
    expect(packageJson.scripts?.dev).not.toContain("--env-file=../.env");
  });

  it("exposes Bruno payment helper scripts", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["bruno:check-payment-env"]).toBe(
      "tsx --env-file=.env src/scripts/check-bruno-payment-env.ts"
    );
    expect(packageJson.scripts?.["bruno:export-payment-webhook"]).toBe(
      "tsx --env-file=.env src/scripts/export-bruno-payment-webhook.ts"
    );
    expect(packageJson.scripts?.["bruno:export-auth-lifecycle-otp"]).toBe(
      "tsx --env-file=.env src/scripts/export-bruno-auth-lifecycle-otp.ts"
    );
  });
});
