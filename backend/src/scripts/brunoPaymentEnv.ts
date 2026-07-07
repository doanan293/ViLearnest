type PaymentEnv = Record<string, string | undefined>;

const requiredPaymentVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "FRONTEND_URL", "API_BASE_URL"] as const;

export function getInvalidBrunoPaymentEnv(env: PaymentEnv = process.env) {
  const invalid: string[] = [];

  for (const name of requiredPaymentVars) {
    if (!env[name]?.trim()) {
      invalid.push(name);
    }
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY?.trim();
  if (stripeSecretKey) {
    if (stripeSecretKey === "mock-secret-key") {
      invalid.push("STRIPE_SECRET_KEY must not be mock-secret-key");
    } else if (!stripeSecretKey.startsWith("sk_test_")) {
      invalid.push("STRIPE_SECRET_KEY must be a Stripe test key");
    }
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (webhookSecret === "mock-webhook-secret") {
    invalid.push("STRIPE_WEBHOOK_SECRET must not be mock-webhook-secret");
  }

  return invalid;
}

export function assertBrunoPaymentEnv(env: PaymentEnv = process.env) {
  const invalid = getInvalidBrunoPaymentEnv(env);
  if (invalid.length > 0) {
    throw new Error(`Bruno Phase C payment workflow requires: ${invalid.join(", ")}`);
  }
}
