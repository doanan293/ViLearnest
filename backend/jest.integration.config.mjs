import unitConfig from "./jest.config.mjs";

/** @type {import("jest").Config} */
export default {
  ...unitConfig,
  rootDir: ".",
  setupFiles: ["<rootDir>/tests/support/integration.setup.ts"],
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
};
