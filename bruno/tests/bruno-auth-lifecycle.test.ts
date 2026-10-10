import { describe, expect, it } from "@jest/globals";
import { getBrunoAuthLifecycleOtpIdentifier, parseBrunoAuthLifecycleOtpValue } from "../tooling/brunoAuthLifecycle.js";

describe("bruno auth lifecycle helpers", () => {
  it("builds Better Auth email OTP identifiers", () => {
    expect(getBrunoAuthLifecycleOtpIdentifier("forget-password", "owned@example.com")).toBe(
      "forget-password-otp-owned@example.com"
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
});
