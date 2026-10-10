import { describe, expect, it } from "@jest/globals";
import { getBrunoDesktopHelpersConfig } from "../tooling/helperConfig.js";

describe("bruno desktop helper config", () => {
  it("disables helpers unless explicitly enabled", () => {
    expect(getBrunoDesktopHelpersConfig({})).toEqual({
      enabled: false,
      token: "",
    });
    expect(
      getBrunoDesktopHelpersConfig({
        BRUNO_DESKTOP_HELPERS_ENABLED: "false",
        BRUNO_DESKTOP_HELPER_TOKEN: "local-token",
      })
    ).toEqual({
      enabled: false,
      token: "",
    });
  });

  it("requires a token when helpers are enabled", () => {
    expect(() =>
      getBrunoDesktopHelpersConfig({
        BRUNO_DESKTOP_HELPERS_ENABLED: "true",
      })
    ).toThrow("BRUNO_DESKTOP_HELPER_TOKEN must be configured when Bruno Desktop helpers are enabled");
  });

  it("refuses to enable fixture helpers in production", () => {
    expect(() =>
      getBrunoDesktopHelpersConfig({
        NODE_ENV: "production",
        BRUNO_DESKTOP_HELPERS_ENABLED: "true",
        BRUNO_DESKTOP_HELPER_TOKEN: "local-token",
      })
    ).toThrow("Bruno Desktop helpers cannot be enabled in production");
  });

  it("trims and exposes the helper token when enabled", () => {
    expect(
      getBrunoDesktopHelpersConfig({
        BRUNO_DESKTOP_HELPERS_ENABLED: "true",
        BRUNO_DESKTOP_HELPER_TOKEN: "  local-token  ",
      })
    ).toEqual({
      enabled: true,
      token: "local-token",
    });
  });
});
