import { main } from "./run.mjs";

console.log("Legacy Bruno command: migrating to payment suites.");
await main(["payment", ...process.argv.slice(2)]);
