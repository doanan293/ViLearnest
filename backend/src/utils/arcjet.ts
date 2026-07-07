import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
import { config } from "../config/index.js";

export const aj = arcjet({
  key: config.arcjetKey,
  rules: [
    shield({ mode: config.arcjetMode }),
    detectBot({
      mode: config.arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    tokenBucket({
      mode: config.arcjetMode,
      refillRate: 5,
      interval: "2m",
      capacity: 10,
    }),
  ],
});
