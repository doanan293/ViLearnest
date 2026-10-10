import { pathToFileURL } from "node:url";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { client } from "../../backend/src/db/index.js";
import { getBrunoDesktopHelpersConfig } from "./helperConfig.js";
import { defaultHelperRoutes } from "./helperRoutes.js";

export async function buildHelperServer() {
  const config = getBrunoDesktopHelpersConfig();
  if (!config.enabled)
    throw new Error("Enable the standalone helper explicitly with BRUNO_DESKTOP_HELPERS_ENABLED=true");
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: false });
  await app.register(defaultHelperRoutes(), { prefix: "/api/v1/bruno-desktop" });
  app.addHook("onClose", async () => {
    await client.end();
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = await buildHelperServer();
  await app.listen({ host: "127.0.0.1", port: Number(process.env.BRUNO_HELPER_PORT || 5001) });
  console.log("Bruno fixture helper listening on loopback");
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, async () => {
      await app.close();
    });
}
