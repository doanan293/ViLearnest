import { describe, expect, it } from "@jest/globals";
import {
  BRUNO_AUTH_LIFECYCLE_EMAIL,
  BRUNO_AUTH_LIFECYCLE_INITIAL_PASSWORD,
  BRUNO_AUTH_LIFECYCLE_RESET_PASSWORD,
  getBrunoAuthLifecycleOtpIdentifier,
  parseBrunoAuthLifecycleOtpValue,
} from "../src/scripts/brunoAuthLifecycle.js";
import { getBrunoAuthLifecycleOtpType } from "../src/scripts/brunoAuthLifecycleRuntime.js";

describe("bruno auth lifecycle helpers", () => {
  it("uses stable lifecycle credentials", () => {
    expect(BRUNO_AUTH_LIFECYCLE_EMAIL).toBe("bruno-auth-lifecycle@example.com");
    expect(BRUNO_AUTH_LIFECYCLE_INITIAL_PASSWORD).toBe("BrunoPass123!");
    expect(BRUNO_AUTH_LIFECYCLE_RESET_PASSWORD).toBe("BrunoResetPass123!");
  });

  it("builds Better Auth email OTP identifiers", () => {
    expect(getBrunoAuthLifecycleOtpIdentifier("forget-password")).toBe(
      "forget-password-otp-bruno-auth-lifecycle@example.com"
    );
  });

  it("parses a stored plain Better Auth OTP value", () => {
    expect(parseBrunoAuthLifecycleOtpValue("123456:0")).toBe("123456");
  });

  it("parses a stored OTP value without an attempts suffix", () => {
    expect(parseBrunoAuthLifecycleOtpValue("654321")).toBe("654321");
  });

  it("rejects an empty stored OTP value", () => {
    expect(() => parseBrunoAuthLifecycleOtpValue(":0")).toThrow("Stored Bruno lifecycle OTP is empty");
  });

  it("parses supported Bruno lifecycle OTP export types", () => {
    expect(getBrunoAuthLifecycleOtpType({})).toBe("forget-password");
    expect(getBrunoAuthLifecycleOtpType({ BRUNO_AUTH_LIFECYCLE_OTP_TYPE: "forget-password" })).toBe("forget-password");
    expect(() => getBrunoAuthLifecycleOtpType({ BRUNO_AUTH_LIFECYCLE_OTP_TYPE: "unsupported" })).toThrow(
      "BRUNO_AUTH_LIFECYCLE_OTP_TYPE must be one of email-verification, sign-in, forget-password, change-email"
    );
  });
});
