import { assertBrunoStorageEnv } from "./brunoStorageEnv.js";

try {
  assertBrunoStorageEnv();
  console.log("Bruno storage environment is configured.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
