import type { FastifyPluginAsync } from "fastify";
import { config } from "../../../config/index.js";
import type { BrunoAuthLifecycleOtpType } from "../../../scripts/brunoAuthLifecycle.js";
import { exportBrunoAuthLifecycleOtp } from "../../../scripts/brunoAuthLifecycleRuntime.js";
import { assertBrunoPaymentEnv } from "../../../scripts/brunoPaymentEnv.js";
import { exportBrunoPaymentWebhookRuntime } from "../../../scripts/brunoPaymentRuntime.js";
import { assertBrunoStorageEnv } from "../../../scripts/brunoStorageEnv.js";
import { resetAndSeedBrunoApi } from "../../../scripts/seed-bruno-api.js";

type BrunoDesktopRouteDependencies = {
  token: string;
  resetAndSeedBrunoApi: typeof resetAndSeedBrunoApi;
  assertBrunoStorageEnv: typeof assertBrunoStorageEnv;
  assertBrunoPaymentEnv: typeof assertBrunoPaymentEnv;
  exportBrunoPaymentWebhookRuntime: typeof exportBrunoPaymentWebhookRuntime;
  exportBrunoAuthLifecycleOtp: (type?: BrunoAuthLifecycleOtpType) => Promise<{
    lifecycleEmail: string;
    lifecycleOtp: string;
  }>;
};

type AuthLifecycleOtpBody = {
  type?: BrunoAuthLifecycleOtpType;
};

const authLifecycleOtpBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["email-verification", "sign-in", "forget-password", "change-email"],
    },
  },
} as const;

function readSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function createBrunoDesktopRoutes(dependencies: BrunoDesktopRouteDependencies): FastifyPluginAsync {
  return async (fastify) => {
    fastify.addHook("preHandler", async (request, reply) => {
      const token = readSingleHeader(request.headers["x-bruno-helper-token"]);
      if (token !== dependencies.token) {
        return reply.status(403).send({
          status: "error",
          message: "Bruno Desktop helper token is invalid",
        });
      }
    });

    fastify.post("/seed", async () => {
      const result = await dependencies.resetAndSeedBrunoApi();
      return {
        ok: true,
        ...result,
      };
    });

    fastify.get("/storage-env", async () => {
      dependencies.assertBrunoStorageEnv();
      return { ok: true };
    });

    fastify.get("/payment-env", async () => {
      dependencies.assertBrunoPaymentEnv();
      return { ok: true };
    });

    fastify.post("/payment-webhook-runtime", async () => dependencies.exportBrunoPaymentWebhookRuntime());

    fastify.post<{ Body: AuthLifecycleOtpBody }>(
      "/auth-lifecycle-otp",
      {
        schema: {
          body: authLifecycleOtpBodySchema,
        },
      },
      async (request) => dependencies.exportBrunoAuthLifecycleOtp(request.body?.type)
    );
  };
}

export const brunoDesktopRoutes = createBrunoDesktopRoutes({
  token: config.brunoDesktopHelpers.token,
  resetAndSeedBrunoApi,
  assertBrunoStorageEnv,
  assertBrunoPaymentEnv,
  exportBrunoPaymentWebhookRuntime,
  exportBrunoAuthLifecycleOtp,
});
