import { client } from "../db/index.js";
import { exportBrunoAuthLifecycleOtp, getBrunoAuthLifecycleOtpType } from "./brunoAuthLifecycleRuntime.js";

async function main() {
  const type = getBrunoAuthLifecycleOtpType();
  const runtime = await exportBrunoAuthLifecycleOtp(type);
  console.log(JSON.stringify(runtime));
}

main()
  .catch((error) => {
    console.error("Bruno auth lifecycle OTP export failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
