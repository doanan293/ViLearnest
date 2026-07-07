import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Fastify from "fastify";
import { createBrunoDesktopRoutes } from "../src/routes/api/v1/bruno-desktop.routes.js";

function createDependencies() {
  return {
    token: "local-helper-token",
    resetAndSeedBrunoApi: jest.fn(async () => ({
      seededCourseId: "bruno-seeded-course",
      userEmail: "bruno.user@example.com",
    })),
    assertBrunoStorageEnv: jest.fn(() => undefined),
    assertBrunoPaymentEnv: jest.fn(() => undefined),
    exportBrunoPaymentWebhookRuntime: jest.fn(async () => ({
      paymentWebhookPayload: "{}",
      paymentWebhookSignature: "t=1,v1=test",
    })),
    exportBrunoAuthLifecycleOtp: jest.fn(async () => ({
      lifecycleEmail: "bruno.lifecycle@example.com",
      lifecycleOtp: "123456",
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
      url: "/seed",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      status: "error",
      message: "Bruno Desktop helper token is invalid",
    });
    expect(dependencies.resetAndSeedBrunoApi).not.toHaveBeenCalled();

    await app.close();
  });

  it("runs the seed helper with the local token", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/seed",
      headers: {
        "x-bruno-helper-token": "local-helper-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      seededCourseId: "bruno-seeded-course",
      userEmail: "bruno.user@example.com",
    });
    expect(dependencies.resetAndSeedBrunoApi).toHaveBeenCalledTimes(1);

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

  it("exports payment webhook runtime variables with the local token", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/payment-webhook-runtime",
      headers: {
        "x-bruno-helper-token": "local-helper-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      paymentWebhookPayload: "{}",
      paymentWebhookSignature: "t=1,v1=test",
    });
    expect(dependencies.exportBrunoPaymentWebhookRuntime).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("exports lifecycle OTP runtime variables for the requested type", async () => {
    const dependencies = createDependencies();
    const app = await buildHelperApp(dependencies);

    const response = await app.inject({
      method: "POST",
      url: "/auth-lifecycle-otp",
      headers: {
        "x-bruno-helper-token": "local-helper-token",
      },
      payload: {
        type: "email-verification",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      lifecycleEmail: "bruno.lifecycle@example.com",
      lifecycleOtp: "123456",
    });
    expect(dependencies.exportBrunoAuthLifecycleOtp).toHaveBeenCalledWith("email-verification");

    await app.close();
  });
});
