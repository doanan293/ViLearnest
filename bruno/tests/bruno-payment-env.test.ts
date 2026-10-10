import { describe, expect, it } from "@jest/globals";
import { assertBrunoPaymentEnv, getInvalidBrunoPaymentEnv } from "../tooling/brunoPaymentEnv.js";

describe("bruno payment env", () => {
  it("returns no invalid names when all payment variables are valid", () => {
    expect(
      getInvalidBrunoPaymentEnv({
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        FRONTEND_URL: "http://localhost:3000",
        API_BASE_URL: "http://localhost:5000",
      })
    ).toEqual([]);
  });

  it("reports missing payment variables", () => {
    expect(getInvalidBrunoPaymentEnv({})).toEqual([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "FRONTEND_URL",
      "API_BASE_URL",
    ]);
  });

  it("rejects mock or non-test Stripe secrets", () => {
    expect(
      getInvalidBrunoPaymentEnv({
        STRIPE_SECRET_KEY: "mock-secret-key",
        STRIPE_WEBHOOK_SECRET: "mock-webhook-secret",
        FRONTEND_URL: "http://localhost:3000",
        API_BASE_URL: "http://localhost:5000",
      })
    ).toEqual([
      "STRIPE_SECRET_KEY must not be mock-secret-key",
      "STRIPE_WEBHOOK_SECRET must not be mock-webhook-secret",
    ]);

    expect(
      getInvalidBrunoPaymentEnv({
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        FRONTEND_URL: "http://localhost:3000",
        API_BASE_URL: "http://localhost:5000",
      })
    ).toEqual(["STRIPE_SECRET_KEY must be a Stripe test key"]);
  });

  it("throws an actionable message", () => {
    expect(() => assertBrunoPaymentEnv({})).toThrow(
      "Bruno Phase C payment workflow requires: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, API_BASE_URL"
    );
  });
});
