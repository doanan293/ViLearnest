import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("parseArcjetMode", () => {
  const originalArcjetMode = process.env.ARCJET_MODE;

  afterEach(() => {
    process.env.ARCJET_MODE = originalArcjetMode;
    jest.resetModules();
  });

  it("uses dry-run mode when configured", async () => {
    process.env.ARCJET_MODE = "DRY_RUN";

    const { parseArcjetMode } = await import("../../src/config/arcjet.js");

    expect(parseArcjetMode()).toBe("DRY_RUN");
  });

  it("uses live mode when configured", async () => {
    process.env.ARCJET_MODE = "LIVE";

    const { parseArcjetMode } = await import("../../src/config/arcjet.js");

    expect(parseArcjetMode()).toBe("LIVE");
  });

  it("fails fast when ARCJET_MODE is missing", async () => {
    delete process.env.ARCJET_MODE;

    const { parseArcjetMode } = await import("../../src/config/arcjet.js");

    expect(() => parseArcjetMode()).toThrow("ARCJET_MODE must be set to LIVE or DRY_RUN");
  });

  it("fails fast when ARCJET_MODE is invalid", async () => {
    process.env.ARCJET_MODE = "development";

    const { parseArcjetMode } = await import("../../src/config/arcjet.js");

    expect(() => parseArcjetMode()).toThrow("ARCJET_MODE must be set to LIVE or DRY_RUN");
  });
});
