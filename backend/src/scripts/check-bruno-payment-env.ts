import { assertBrunoPaymentEnv } from "./brunoPaymentEnv.js";

try {
  assertBrunoPaymentEnv();
  console.log("Bruno payment environment is configured.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
