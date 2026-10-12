import { describe, expect, it } from "@jest/globals";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("auth configuration", () => {
  it("loads Better Auth with email OTP and social account linking enabled", async () => {
    const originalGithubClientId = process.env.AUTH_GITHUB_CLIENT_ID;
    const originalGithubClientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;
    const originalGoogleClientId = process.env.AUTH_GOOGLE_CLIENT_ID;
    const originalGoogleClientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET;

    delete process.env.AUTH_GITHUB_CLIENT_ID;
    delete process.env.AUTH_GITHUB_CLIENT_SECRET;
    delete process.env.AUTH_GOOGLE_CLIENT_ID;
    delete process.env.AUTH_GOOGLE_CLIENT_SECRET;

    try {
      const { auth } = await import("../../src/auth.js");

      expect(auth).toBeDefined();
      expect(auth.options.baseURL).toBe("http://localhost:5000");
      expect(auth.options.plugins?.some((plugin: { id?: string }) => plugin.id === "email-otp")).toBe(true);
      expect(auth.options.socialProviders).toMatchObject({
        github: {
          clientId: "mock-github-id",
          clientSecret: "mock-github-secret",
        },
        google: {
          clientId: "mock-google-id",
          clientSecret: "mock-google-secret",
        },
      });
      // Linking only when the provider says the email is verified: a trusted provider would
      // skip that check, and GitHub allows unverified addresses.
      expect(auth.options.account?.accountLinking?.enabled).toBe(true);
      expect(auth.options.account?.accountLinking?.trustedProviders).toBeUndefined();
    } finally {
      restoreEnv("AUTH_GITHUB_CLIENT_ID", originalGithubClientId);
      restoreEnv("AUTH_GITHUB_CLIENT_SECRET", originalGithubClientSecret);
      restoreEnv("AUTH_GOOGLE_CLIENT_ID", originalGoogleClientId);
      restoreEnv("AUTH_GOOGLE_CLIENT_SECRET", originalGoogleClientSecret);
    }
  });
});
