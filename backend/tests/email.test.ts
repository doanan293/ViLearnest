import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { sendEmail } from "../src/utils/email.js";

describe("sendEmail", () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let fetchSpy: jest.SpiedFunction<typeof global.fetch>;
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        text: async () => "ok",
      } as Response;
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    fetchSpy.mockRestore();
    process.env.RESEND_API_KEY = originalApiKey;
  });

  it("logs email containing verification URL if RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await sendEmail({
      to: "verify@test.com",
      subject: "Verify Email",
      text: "http://localhost:5000/verify?token=123",
      html: "<p>Verification link</p>",
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("[DEVELOPMENT EMAIL]"));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("To:      verify@test.com"));
  });

  it("sends email via Resend API if RESEND_API_KEY is present", async () => {
    process.env.RESEND_API_KEY = "test-key";
    await sendEmail({
      to: "verify@test.com",
      subject: "Verify Email",
      text: "http://localhost:5000/verify?token=123",
      html: "<p>Verification link</p>",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    );
  });

  it("logs reserved example.com emails locally even if RESEND_API_KEY is present", async () => {
    process.env.RESEND_API_KEY = "test-key";
    await sendEmail({
      to: "bruno-auth-lifecycle@example.com",
      subject: "Reset Password",
      text: "Your verification code is: 123456",
      html: "<p>123456</p>",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("[DEVELOPMENT EMAIL]"));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("bruno-auth-lifecycle@example.com"));
  });
});
