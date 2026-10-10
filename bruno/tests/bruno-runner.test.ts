import { jest } from "@jest/globals";
import { CORE_SUITES, redactReport, runSuites, selectSuites } from "../tooling/runner.mjs";

function dependencies() {
  return {
    runProcess: jest.fn(
      async (_options: {
        executable: string;
        args: string[];
        cwd: string;
        env: Record<string, string | undefined>;
        signal?: AbortSignal;
      }) => ({ exitCode: 0 })
    ),
    cleanupRun: jest.fn(async (_ref: unknown, _options: { timeoutMs: number }) => ({
      remaining: [] as string[],
      retained: [] as string[],
    })),
    readReport: jest.fn(async () => [
      { results: [{ test: { filename: "mock/request.bru" }, status: "pass", testResults: [] }] },
    ]),
    writeReport: jest.fn(async () => undefined),
  };
}

it("core selects only system/auth/profile/catalog/admin/learning and has no provider preflight", async () => {
  expect(selectSuites("core")).toEqual(CORE_SUITES);
  const deps = dependencies();
  const result = await runSuites({ suites: selectSuites("core"), helperToken: "private-helper-token" }, deps);
  expect(result.exitCode).toBe(0);
  expect(result.results.map((entry) => entry.suite)).toEqual(CORE_SUITES);
  const commands = deps.runProcess.mock.calls.map(([options]) => options.args.join(" "));
  expect(commands.join(" ")).not.toMatch(/storage|payment|seed|private-helper-token/);
  expect(deps.cleanupRun).toHaveBeenCalledTimes(5);
});

it("creates one fresh UUID per stateful folder and sends secrets only in the process environment", async () => {
  const deps = dependencies();
  const result = await runSuites({ suites: ["auth", "profile"], helperToken: "private-helper-token" }, deps);
  expect(new Set(result.results.map((entry) => ("runRef" in entry ? entry.runRef?.runId : undefined))).size).toBe(2);
  for (const [options] of deps.runProcess.mock.calls) {
    expect(options.env.BRUNO_DESKTOP_HELPER_TOKEN).toBe("private-helper-token");
    expect(options.args).not.toContain("private-helper-token");
    expect(options.args).toContain("--reporter-json");
  }
});

it("cleans a failed Bruno process and preserves its original failure when cleanup also fails", async () => {
  const deps = dependencies();
  deps.runProcess.mockResolvedValue({ exitCode: 7 });
  deps.cleanupRun.mockRejectedValue(new Error("helper outage"));
  const result = await runSuites({ suites: ["profile"], helperToken: "local-token" }, deps);
  expect(result.exitCode).toBe(7);
  expect(deps.cleanupRun).toHaveBeenCalledTimes(1);
  expect(result.results[0].outcome).toBe("failed");
  expect("recovery" in result.results[0] ? result.results[0].recovery : undefined).toContain(
    "npm run test:api:cleanup -- --run-id"
  );
  expect("recovery" in result.results[0] ? result.results[0].recovery : undefined).toContain("--suite profile");
});

it("fails when tests pass but cleanup has retryable resources", async () => {
  const deps = dependencies();
  deps.cleanupRun.mockResolvedValue({ remaining: ["uploads/owned-key"], retained: [] });
  const result = await runSuites({ suites: ["storage"], helperToken: "local-token" }, deps);
  expect(result.exitCode).toBe(1);
  expect(result.results[0].cleanupRemaining).toEqual(["uploads/owned-key"]);
});

it("SIGINT stops new folders and starts bounded cleanup for the interrupted run", async () => {
  const controller = new AbortController();
  const deps = dependencies();
  deps.runProcess.mockImplementation(async () => {
    controller.abort();
    return { exitCode: 130 };
  });
  const result = await runSuites({ suites: ["auth", "profile"], signal: controller.signal }, deps);
  expect(result.exitCode).toBe(130);
  expect(deps.cleanupRun).toHaveBeenCalledTimes(1);
  expect(deps.cleanupRun.mock.calls[0][1].timeoutMs).toBe(5000);
  expect(result.results[1].outcome).toBe("not-run");
  expect("recovery" in result.results[0] ? result.results[0].recovery : undefined).toContain("test:api:cleanup");
});

it("retains only request filenames/status/counts instead of cookies, tokens, OTPs or signed URLs", () => {
  const raw = [
    {
      results: [
        {
          test: { filename: "07-payment/paid.bru" },
          status: "fail",
          request: {
            url: "https://storage/object?signature=private-signature",
            headers: { Cookie: "session-private-token" },
            body: "private-helper-token",
          },
          response: { status: 400, body: { otp: "123456" } },
          testResults: [{ status: "fail", description: "123456", error: "session-private-token" }],
        },
      ],
    },
  ];
  const output = JSON.stringify(redactReport(raw));
  for (const value of [
    "private-signature",
    "session-private-token",
    "private-helper-token",
    "123456",
    "https://storage",
  ])
    expect(output).not.toContain(value);
  expect(output).toContain("07-payment/paid.bru");
  expect(output).toContain("failed");
});

it("preserves the primary process failure if writing the sanitized report also fails", async () => {
  const deps = dependencies();
  deps.runProcess.mockResolvedValue({ exitCode: 7 });
  deps.writeReport.mockRejectedValue(new Error("disk unavailable"));
  const result = await runSuites({ suites: ["profile"] }, deps);
  expect(result.exitCode).toBe(7);
  expect(deps.cleanupRun).toHaveBeenCalledTimes(1);
  expect(result.results[0]).toMatchObject({ reportWriteFailed: true });
});

it("marks CLI pass status as failed when its assertion or script test fails", () => {
  const report = redactReport([
    {
      results: [
        { test: { filename: "profile/assertion.bru" }, status: "pass", assertionResults: [{ status: "fail" }] },
        { test: { filename: "profile/script.bru" }, status: "pass", postResponseTestResults: [{ status: "fail" }] },
        { test: { filename: "profile/test.bru" }, status: "pass", testResults: [{ status: "fail" }] },
      ],
    },
  ]);
  expect(report.requests.map((request) => request.outcome)).toEqual(["failed", "failed", "failed"]);
});
