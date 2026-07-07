import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const brunoRoot = join(process.cwd(), "..", "bruno");

const desktopHelperFiles = [
  "seed.bru",
  "check-storage-env.bru",
  "check-payment-env.bru",
  "export-payment-webhook-runtime.bru",
  "export-auth-lifecycle-otp.bru",
];

function readDesktopHelper(file: string) {
  return readFileSync(join(brunoRoot, "desktop-helpers", file), "utf8");
}

describe("bruno desktop workflow files", () => {
  it("contains every Desktop helper request file", () => {
    for (const file of desktopHelperFiles) {
      expect(existsSync(join(brunoRoot, "desktop-helpers", file))).toBe(true);
    }
  });

  it("exposes the local Desktop helper token in the local environment", () => {
    const localEnvironment = readFileSync(join(brunoRoot, "environments", "local.bru"), "utf8");

    expect(localEnvironment).toContain("brunoDesktopHelperToken: bruno-desktop-local-token");
  });

  it("sends the local helper token to every Desktop helper route", () => {
    for (const file of desktopHelperFiles) {
      const source = readDesktopHelper(file);

      expect(source).toContain("{{baseUrl}}/api/v1/bruno-desktop/");
      expect(source).toContain("x-bruno-helper-token: {{brunoDesktopHelperToken}}");
    }
  });

  it("stores exported runtime variables for later Desktop requests", () => {
    const paymentRuntime = readDesktopHelper("export-payment-webhook-runtime.bru");
    const lifecycleOtp = readDesktopHelper("export-auth-lifecycle-otp.bru");

    expect(paymentRuntime).toContain('bru.setVar("paymentWebhookPayload", res.body.paymentWebhookPayload);');
    expect(paymentRuntime).toContain('bru.setVar("paymentWebhookSignature", res.body.paymentWebhookSignature);');
    expect(lifecycleOtp).toContain('bru.setVar("lifecycleEmail", res.body.lifecycleEmail);');
    expect(lifecycleOtp).toContain('bru.setVar("lifecycleOtp", res.body.lifecycleOtp);');
  });

  it("uses Desktop runtime variables before environment fallbacks in downstream workflows", () => {
    const paymentWebhook = readFileSync(
      join(brunoRoot, "payment-workflows", "stripe-checkout-completed-webhook.bru"),
      "utf8"
    );
    const resetPassword = readFileSync(
      join(brunoRoot, "auth-lifecycle-workflows", "reset-password-lifecycle-user.bru"),
      "utf8"
    );

    expect(paymentWebhook).toContain(
      'const payload = bru.getVar("paymentWebhookPayload") || bru.getEnvVar("paymentWebhookPayload");'
    );
    expect(paymentWebhook).toContain(
      'const signature = bru.getVar("paymentWebhookSignature") || bru.getEnvVar("paymentWebhookSignature");'
    );
    expect(paymentWebhook).toContain('req.setHeader("stripe-signature", signature);');

    expect(resetPassword).toContain(
      'const lifecycleEmail = bru.getVar("lifecycleEmail") || bru.getEnvVar("lifecycleEmail");'
    );
    expect(resetPassword).toContain(
      'const lifecycleOtp = bru.getVar("lifecycleOtp") || bru.getEnvVar("lifecycleOtp");'
    );
    expect(resetPassword).toContain(
      'const lifecycleResetPassword = bru.getVar("lifecycleResetPassword") || bru.getEnvVar("lifecycleResetPassword");'
    );
    expect(resetPassword).toContain("req.setBody(JSON.stringify({");
  });

  it("documents both full CLI and full Bruno Desktop runbooks", () => {
    const readme = readFileSync(join(brunoRoot, "README.md"), "utf8");

    expect(readme).toContain("## CLI Full Run");
    expect(readme).toContain("## Bruno Desktop Full Run");
    expect(readme).toContain("BRUNO_DESKTOP_HELPERS_ENABLED=true");
    expect(readme).toContain("BRUNO_DESKTOP_HELPER_TOKEN=bruno-desktop-local-token");
    expect(readme).toContain("desktop-helpers/export-payment-webhook-runtime");
    expect(readme).toContain("desktop-helpers/export-auth-lifecycle-otp");
  });
});
