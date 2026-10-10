import { describe, expect, it } from "@jest/globals";
import { HttpError } from "../../src/lib/errors.js";

describe("HttpError", () => {
  it("stores the HTTP status code and message", () => {
    const error = new HttpError(418, "Teapot");

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe("Teapot");
  });
});
