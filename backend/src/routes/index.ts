import type { FastifyPluginAsync } from "fastify";
import { v1Routes } from "./api/v1/index.js";

export const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(v1Routes, { prefix: "/api/v1" });
};
