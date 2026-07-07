import { describe, expect, it } from "@jest/globals";
import { getBrunoDesktopHelpersConfig } from "../src/config/brunoDesktop.js";

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
