import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("bruno payment workflow files", () => {
  it("targets the registered plural Stripe webhook route", () => {
    const webhookRequest = readFileSync(
      join(process.cwd(), "..", "bruno", "payment-workflows", "stripe-checkout-completed-webhook.bru"),
      "utf8"
    );

    expect(webhookRequest).toContain("{{baseUrl}}/api/v1/webhooks/stripe");
    expect(webhookRequest).not.toContain("{{baseUrl}}/api/v1/webhook/stripe");
  });
});
