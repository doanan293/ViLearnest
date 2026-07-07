import type { ArcjetMode } from "@arcjet/protocol";

export function parseArcjetMode(value = process.env.ARCJET_MODE): ArcjetMode {
  if (value !== "LIVE" && value !== "DRY_RUN") {
    throw new Error("ARCJET_MODE must be set to LIVE or DRY_RUN");
  }
  return value;
}
