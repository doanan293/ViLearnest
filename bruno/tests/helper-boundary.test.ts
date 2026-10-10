import { build } from "../../backend/src/app.js";
import { buildHelperServer } from "../tooling/server.js";

describe("standalone fixture helper boundary", () => {
  const originalEnabled = process.env.BRUNO_DESKTOP_HELPERS_ENABLED;
  const originalToken = process.env.BRUNO_DESKTOP_HELPER_TOKEN;

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.BRUNO_DESKTOP_HELPERS_ENABLED;
    else process.env.BRUNO_DESKTOP_HELPERS_ENABLED = originalEnabled;
    if (originalToken === undefined) delete process.env.BRUNO_DESKTOP_HELPER_TOKEN;
    else process.env.BRUNO_DESKTOP_HELPER_TOKEN = originalToken;
  });

  it("does not expose fixture endpoints through the product even with helper flags enabled", async () => {
    process.env.BRUNO_DESKTOP_HELPERS_ENABLED = "true";
    process.env.BRUNO_DESKTOP_HELPER_TOKEN = "boundary-local-token";
    const app = await build({ logger: false });
    try {
      const response = await app.inject({ method: "POST", url: "/api/v1/bruno-desktop/runs/setup" });
      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("requires explicit activation and authentication on the separate helper", async () => {
    delete process.env.BRUNO_DESKTOP_HELPERS_ENABLED;
    await expect(buildHelperServer()).rejects.toThrow("Enable the standalone helper explicitly");
    process.env.BRUNO_DESKTOP_HELPERS_ENABLED = "true";
    process.env.BRUNO_DESKTOP_HELPER_TOKEN = "boundary-local-token";
    const helper = await buildHelperServer();
    try {
      const response = await helper.inject({
        method: "POST",
        url: "/api/v1/bruno-desktop/runs/setup",
        payload: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" },
      });
      expect(response.statusCode).toBe(403);
    } finally {
      await helper.close();
    }
  });
});
