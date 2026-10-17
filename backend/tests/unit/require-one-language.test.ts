import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import Fastify from "fastify";
import { requireOneLanguage } from "../../src/routes/schemas.js";

describe("requireOneLanguage", () => {
  const app = Fastify();

  beforeAll(async () => {
    app.post(
      "/echo",
      {
        schema: {
          body: {
            type: "object",
            ...requireOneLanguage("titleEn", "titleVi"),
            properties: { titleEn: { type: ["string", "null"] }, titleVi: { type: ["string", "null"] } },
          },
        },
      },
      async (request) => request.body
    );
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects a title made only of spaces", async () => {
    const response = await app.inject({ method: "POST", url: "/echo", payload: { titleEn: "   ", titleVi: null } });
    expect(response.statusCode).toBe(400);
  });

  it("accepts a Vietnamese-only title and keeps the English null", async () => {
    const response = await app.inject({ method: "POST", url: "/echo", payload: { titleEn: null, titleVi: "Khóa A" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ titleEn: null, titleVi: "Khóa A" });
  });
});
