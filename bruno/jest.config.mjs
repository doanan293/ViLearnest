export default {
  rootDir: "..",
  preset: "ts-jest/presets/default-esm",
  setupFiles: ["<rootDir>/bruno/tests/jest.setup.ts"],
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/bruno/tsconfig.tests.json", useESM: true }] },
  testMatch: ["<rootDir>/bruno/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/integration/"],
  testTimeout: 30000,
  maxWorkers: 1,
};
