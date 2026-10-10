import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.e2e.ts",
	workers: 1,
	fullyParallel: false,
	retries: 0,
	forbidOnly: Boolean(process.env.CI),
	timeout: 60_000,
	expect: { timeout: 10_000 },
	outputDir: "./test-results",
	reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
	use: {
		baseURL: "http://localhost:3002",
		locale: "vi-VN",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			command: "node --import tsx tests/e2e/run-server.mjs backend",
			url: "http://localhost:5002/api/v1/health",
			reuseExistingServer: false,
			timeout: 60_000,
			gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
		},
		{
			command: "node --import tsx tests/e2e/run-server.mjs frontend",
			url: "http://localhost:3002/vi/login",
			reuseExistingServer: false,
			timeout: 300_000,
			gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
		},
	],
});
