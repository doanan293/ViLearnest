type BrunoDesktopHelpersEnv = Record<string, string | undefined>;

export type BrunoDesktopHelpersConfig = {
  enabled: boolean;
  token: string;
};

export function getBrunoDesktopHelpersConfig(env: BrunoDesktopHelpersEnv = process.env): BrunoDesktopHelpersConfig {
  const enabled = env.BRUNO_DESKTOP_HELPERS_ENABLED === "true";

  if (enabled && env.NODE_ENV === "production") {
    throw new Error("Bruno Desktop helpers cannot be enabled in production");
  }

  if (!enabled) {
    return {
      enabled: false,
      token: "",
    };
  }

  const token = env.BRUNO_DESKTOP_HELPER_TOKEN?.trim();
  if (!token) {
    throw new Error("BRUNO_DESKTOP_HELPER_TOKEN must be configured when Bruno Desktop helpers are enabled");
  }

  return {
    enabled: true,
    token,
  };
}
