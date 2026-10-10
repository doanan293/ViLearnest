/** @type {import("jest").Config} */
const config = {
	testEnvironment: "jsdom",
	roots: ["<rootDir>/tests"],
	testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
	testMatch: ["**/*.{spec,test}.{ts,tsx}"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transform: {
		"^.+\\.[jt]sx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.jest.json",
			},
		],
	},
	setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup.ts"],
	collectCoverageFrom: [
		"**/*.{ts,tsx}",
		"!**/*.d.ts",
		"!src/app/**/*",
		"!src/test-utils/**",
		"!next-env.d.ts",
	],
};

module.exports = config;
