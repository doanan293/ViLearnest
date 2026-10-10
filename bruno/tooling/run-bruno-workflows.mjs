import { main } from "./run.mjs";

console.log("Legacy Bruno command: migrating to core suites.");
await main(["core", ...process.argv.slice(2)]);
