export default {
  "preset": "ts-jest/presets/default-esm",
  "testEnvironment": "node",
  "extensionsToTreatAsEsm": [
    ".ts"
  ],
  "moduleNameMapper": {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  "testTimeout": 30000,
  "maxWorkers": 1,
  "rootDir": "..",
  "setupFiles": [
    "<rootDir>/backend/tests/support/integration.setup.ts"
  ],
  "transform": {
    "^.+\\.ts$": [
      "ts-jest",
      {
        "tsconfig": "<rootDir>/bruno/tsconfig.tests.json",
        "useESM": true
      }
    ]
  },
  "testMatch": [
    "<rootDir>/bruno/tests/integration/**/*.test.ts"
  ]
};
