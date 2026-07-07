import { build } from "./app.js";
import { config } from "./config/index.js";
import { client } from "./db/index.js";

async function main() {
  const app = await build({ logger: true });

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
