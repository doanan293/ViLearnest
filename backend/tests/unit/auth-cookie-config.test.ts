import { describe, expect, it } from "@jest/globals";
import { getAuthCookieOptions, parseAuthCookieSecure } from "../../src/config/auth-cookie.js";

describe("auth cookie config", () => {
  it("defaults to non-secure lax cookies outside production", () => {
    expect(getAuthCookieOptions({}, "development")).toEqual({
      secure: false,
      sameSite: "lax",
    });
  });

  it("defaults to secure sameSite none cookies in production", () => {
    expect(getAuthCookieOptions({}, "production")).toEqual({
      secure: true,
      sameSite: "none",
    });
  });

  it("allows AUTH_COOKIE_SECURE=false to override production for local automation", () => {
    expect(getAuthCookieOptions({ AUTH_COOKIE_SECURE: "false" }, "production")).toEqual({
      secure: false,
      sameSite: "lax",
    });
  });

  it("allows AUTH_COOKIE_SECURE=true to force secure cookies", () => {
    expect(parseAuthCookieSecure("true", false)).toBe(true);
  });

  it("rejects invalid AUTH_COOKIE_SECURE values", () => {
    expect(() => parseAuthCookieSecure("yes", false)).toThrow("AUTH_COOKIE_SECURE must be either true or false");
  });
});
