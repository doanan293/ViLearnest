import { client } from "../db/index.js";
import { exportBrunoPaymentWebhookRuntime } from "./brunoPaymentRuntime.js";

async function main() {
  const runtime = await exportBrunoPaymentWebhookRuntime();
  console.log(JSON.stringify(runtime));
}

main()
  .catch((error) => {
    console.error("Bruno payment webhook export failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
