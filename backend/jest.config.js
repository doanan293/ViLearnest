/** @type {import("ts-jest").JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  setupFiles: ["./tests/jest.setup.ts"],
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        useESM: true,
      },
    ],
  },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  verbose: true,
};
