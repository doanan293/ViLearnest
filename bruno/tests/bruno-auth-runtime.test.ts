import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Fastify from "fastify";
import type { Actor, RunRef } from "../tooling/fixtures/types.js";
import { createBrunoDesktopRoutes } from "../tooling/helperRoutes.js";

function createDependencies() {
  return {
    token: "local-helper-token",
    trackOwnedStorage: jest.fn(async () => undefined),
    inspectOwnedObject: jest.fn(async () => ({ exists: false as const })),
    trackRunPaymentSession: jest.fn(async (_ref: RunRef, sessionId: string) => ({ sessionId, customerId: "cus_test" })),
    buildRunPaymentEvent: jest.fn(async () => ({ payload: "{}", signature: "test" })),
    setupRun: jest.fn(async (ref: RunRef) => ({
      ref,
      actors: {
        admin: { id: "admin", email: "admin@example.com", password: "test" },
        learnerA: { id: "learnerA", email: "a@example.com", password: "test" },
        learnerB: { id: "learnerB", email: "b@example.com", password: "test" },
      },
      ids: {},
    })),
    cleanupRun: jest.fn(async (_ref: RunRef) => ({ remaining: [] as string[], retained: [] as string[] })),
    assertBrunoStorageEnv: jest.fn(() => undefined),
    assertBrunoPaymentEnv: jest.fn(() => undefined),
    readRunOtp: jest.fn(async (_ref: RunRef, _actor: string, _type: string) => ({
      email: "learner@example.com",
      otp: "123456",
    })),
    recordRegisteredActor: jest.fn(async (_ref: RunRef, _actor: Actor, userId: string) => ({
      id: userId,
      email: "learner@example.com",
    })),
  };
}

async function buildApp(dependencies: ReturnType<typeof createDependencies>) {
  const app = Fastify();
  await app.register(createBrunoDesktopRoutes(dependencies));
  await app.ready();
  return app;
}

describe("run-scoped Bruno auth helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns OTP only for an explicitly owned run actor and supported type", async () => {
    const dependencies = createDependencies();
    const app = await buildApp(dependencies);
    const response = await app.inject({
      method: "POST",
      url: "/runs/otp",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload: {
        runId: "123e4567-e89b-42d3-a456-426614174000",
        suite: "auth",
        actor: "learnerA",
        type: "email-verification",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ email: "learner@example.com", otp: "123456" });
    expect(dependencies.readRunOtp).toHaveBeenCalledWith(
      { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "auth" },
      "learnerA",
      "email-verification"
    );
    await app.close();
  });

  it("rejects unsupported OTP types and foreign actor registration records before work", async () => {
    const dependencies = createDependencies();
    const app = await buildApp(dependencies);
    const headers = { "x-bruno-helper-token": "local-helper-token" };
    const ref: RunRef = { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "auth" };

    const unsupportedOtp = await app.inject({
      method: "POST",
      url: "/runs/otp",
      headers,
      payload: { ...ref, actor: "learnerA", type: "change-email" },
    });
    const foreignActor = await app.inject({
      method: "POST",
      url: "/runs/actors/registered",
      headers,
      payload: { ...ref, actor: "admin", userId: "another-run-user" },
    });

    expect(unsupportedOtp.statusCode).toBe(400);
    expect(foreignActor.statusCode).toBe(400);
    expect(dependencies.readRunOtp).not.toHaveBeenCalled();
    expect(dependencies.recordRegisteredActor).not.toHaveBeenCalled();
    await app.close();
  });
  it("allows a run-owned sign-in OTP lookup", async () => {
    const dependencies = createDependencies();
    const app = await buildApp(dependencies);
    const response = await app.inject({
      method: "POST",
      url: "/runs/otp",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "auth", actor: "learnerA", type: "sign-in" },
    });
    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
