import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Fastify from "fastify";
import type { RunRef } from "../tooling/fixtures/types.js";
import { createBrunoDesktopRoutes } from "../tooling/helperRoutes.js";

function createDependencies() {
  return {
    token: "local-helper-token",
    setupRun: jest.fn(async (ref: RunRef) => ({
      ref,
      actors: {
        admin: { id: "admin", email: "admin@example.com", password: "test" },
        learnerA: { id: "learnerA", email: "a@example.com", password: "test" },
        learnerB: { id: "learnerB", email: "b@example.com", password: "test" },
      },
      ids: { publishedCourse: "course-id" },
    })),
    cleanupRun: jest.fn(async (_ref: RunRef) => ({ remaining: [] as string[], retained: [] as string[] })),
    assertBrunoStorageEnv: jest.fn(() => undefined),
    assertBrunoPaymentEnv: jest.fn(() => undefined),
    readRunOtp: jest.fn(async (_ref: RunRef, _actor: string, _type: string) => ({
      email: "learner@example.com",
      otp: "123456",
    })),
    recordRegisteredActor: jest.fn(async (_ref: RunRef, _actor: "admin" | "learnerA" | "learnerB", userId: string) => ({
      id: userId,
      email: "learner@example.com",
    })),
    trackOwnedStorage: jest.fn(async (_ref: RunRef, _key: string) => undefined),
    inspectOwnedObject: jest.fn(async (_ref: RunRef, _key: string) => ({ exists: false as const })),
    trackRunPaymentSession: jest.fn(async (_ref: RunRef, sessionId: string) => ({
      customerId: "cus_owned",
      sessionId,
    })),
    buildRunPaymentEvent: jest.fn(async (_ref: RunRef, variant: string) => ({
      payload: `event:${variant}`,
      signature: "t=1,v1=test",
    })),
  };
}

async function buildHelperApp(dependencies: ReturnType<typeof createDependencies>) {
  const app = Fastify();
  await app.register(createBrunoDesktopRoutes(dependencies));
  await app.ready();
  return app;
}

describe("bruno desktop helper routes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects helper requests without the local token", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/runs/cleanup",
      payload: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      status: "error",
      message: "Bruno Desktop helper token is invalid",
    });
    expect(dependencies.setupRun).not.toHaveBeenCalled();
    expect(dependencies.cleanupRun).not.toHaveBeenCalled();

    await app.close();
  });

  it("creates fixtures only for the validated owned run reference", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/runs/setup",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ref: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" },
      ids: { publishedCourse: "course-id" },
    });
    expect(dependencies.setupRun).toHaveBeenCalledWith({
      runId: "123e4567-e89b-42d3-a456-426614174000",
      suite: "profile",
    });

    await app.close();
  });

  it("cleans only the requested validated run reference", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/runs/cleanup",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload: { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ remaining: [], retained: [] });
    expect(dependencies.cleanupRun).toHaveBeenCalledWith({
      runId: "123e4567-e89b-42d3-a456-426614174000",
      suite: "profile",
    });

    await app.close();
  });

  it("rejects malformed run references before invoking fixture operations", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/runs/setup",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload: { runId: "../../other-run", suite: "profile" },
    });

    expect(response.statusCode).toBe(400);
    expect(dependencies.setupRun).not.toHaveBeenCalled();

    await app.close();
  });

  it("tracks and inspects only storage objects under a validated run", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);
    const payload = {
      runId: "123e4567-e89b-42d3-a456-426614174000",
      suite: "storage",
      key: "uploads/123-123e4567-e89b-42d3-a456-426614174000-file.txt",
    };

    const tracked = await app.inject({
      method: "POST",
      url: "/runs/storage/track",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload,
    });
    const inspected = await app.inject({
      method: "POST",
      url: "/runs/storage/inspect",
      headers: { "x-bruno-helper-token": "local-helper-token" },
      payload,
    });

    expect(tracked.statusCode).toBe(200);
    expect(tracked.json()).toEqual({ tracked: true, key: payload.key });
    expect(inspected.statusCode).toBe(200);
    expect(inspected.json()).toEqual({ exists: false });
    expect(dependencies.trackOwnedStorage).toHaveBeenCalledWith(
      { runId: payload.runId, suite: "storage" },
      payload.key
    );
    expect(dependencies.inspectOwnedObject).toHaveBeenCalledWith(
      { runId: payload.runId, suite: "storage" },
      payload.key
    );

    await app.close();
  });

  it("tracks a Stripe test session and builds only enumerated run-owned webhook variants", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);
    const headers = { "x-bruno-helper-token": "local-helper-token" };
    const ref: RunRef = { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "payment" };
    const tracked = await app.inject({
      method: "POST",
      url: "/runs/payment/track",
      headers,
      payload: { ...ref, sessionId: "cs_test_owned_session_1" },
    });
    const event = await app.inject({
      method: "POST",
      url: "/runs/payment/event",
      headers,
      payload: { ...ref, variant: "wrong-owner" },
    });
    const rejected = await app.inject({
      method: "POST",
      url: "/runs/payment/event",
      headers,
      payload: { ...ref, variant: "arbitrary" },
    });

    expect(tracked.statusCode).toBe(200);
    expect(tracked.json()).toEqual({ customerId: "cus_owned", sessionId: "cs_test_owned_session_1" });
    expect(event.statusCode).toBe(200);
    expect(event.json()).toEqual({ payload: "event:wrong-owner", signature: "t=1,v1=test" });
    expect(rejected.statusCode).toBe(400);
    expect(dependencies.trackRunPaymentSession).toHaveBeenCalledWith(ref, "cs_test_owned_session_1");
    expect(dependencies.buildRunPaymentEvent).toHaveBeenCalledWith(ref, "wrong-owner");

    await app.close();
  });

  it("runs environment checks with the local token", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const storageResponse = await app.inject({
      method: "GET",
      url: "/storage-env",
      headers: {
        "x-bruno-helper-token": "local-helper-token",
      },
    });
    const paymentResponse = await app.inject({
      method: "GET",
      url: "/payment-env",
      headers: {
        "x-bruno-helper-token": "local-helper-token",
      },
    });

    expect(storageResponse.statusCode).toBe(200);
    expect(storageResponse.json()).toEqual({ ok: true });
    expect(paymentResponse.statusCode).toBe(200);
    expect(paymentResponse.json()).toEqual({ ok: true });
    expect(dependencies.assertBrunoStorageEnv).toHaveBeenCalledTimes(1);
    expect(dependencies.assertBrunoPaymentEnv).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("retires unscoped seed and runtime endpoints", async () => {
    const app = await buildHelperApp(createDependencies());
    for (const url of ["/seed", "/payment-webhook-runtime", "/auth-lifecycle-otp"]) {
      const response = await app.inject({
        method: "POST",
        url,
        headers: { "x-bruno-helper-token": "local-helper-token" },
        payload: {},
      });
      expect(response.statusCode).toBe(404);
    }
    await app.close();
  });
});
