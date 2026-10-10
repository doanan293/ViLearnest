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
});
