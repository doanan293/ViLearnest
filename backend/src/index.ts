import type { FastifyInstance } from "fastify";
import { build } from "./build-app.js";
import { config } from "./config/index.js";
import { client } from "./db/index.js";

async function main() {
  // The `fastify` import also makes this file the entrypoint Vercel detects for the function.
  const app: FastifyInstance = await build({ logger: true });

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    await client.end();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`Fastify running on http://localhost:${config.port}`);
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
