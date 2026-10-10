import type { FastifyPluginAsync } from "fastify";
import { readRunOtp } from "./brunoAuthLifecycleRuntime.js";
import { assertBrunoPaymentEnv } from "./brunoPaymentEnv.js";
import { buildRunPaymentEvent, trackRunPaymentSession } from "./brunoPaymentRuntime.js";
import { assertBrunoStorageEnv } from "./brunoStorageEnv.js";
import { cleanupRun, recordRegisteredActor, setupRun } from "./fixtures/fixtures.js";
import { validateRunRef } from "./fixtures/runStore.js";
import { inspectOwnedObject, trackOwnedStorage } from "./fixtures/storageProbe.js";
import type { Actor, RunRef } from "./fixtures/types.js";
import { getBrunoDesktopHelpersConfig } from "./helperConfig.js";

type BrunoDesktopRouteDependencies = {
  token: string;
  setupRun: typeof setupRun;
  cleanupRun: typeof cleanupRun;
  assertBrunoStorageEnv: typeof assertBrunoStorageEnv;
  assertBrunoPaymentEnv: typeof assertBrunoPaymentEnv;
  readRunOtp: typeof readRunOtp;
  recordRegisteredActor: typeof recordRegisteredActor;
  trackOwnedStorage: typeof trackOwnedStorage;
  inspectOwnedObject: typeof inspectOwnedObject;
  trackRunPaymentSession: typeof trackRunPaymentSession;
  buildRunPaymentEvent: typeof buildRunPaymentEvent;
};

const runRefBodySchema = {
  type: "object",
  required: ["runId", "suite"],
  additionalProperties: false,
  properties: {
    runId: {
      type: "string",
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
    },
    suite: {
      type: "string",
      enum: ["auth", "profile", "public-courses", "admin-courses", "learning-access", "payment", "storage"],
    },
  },
} as const;

const runOtpBodySchema = {
  type: "object",
  required: ["runId", "suite", "actor", "type"],
  additionalProperties: false,
  properties: {
    runId: runRefBodySchema.properties.runId,
    suite: runRefBodySchema.properties.suite,
    actor: { type: "string", enum: ["admin", "learnerA", "learnerB"] },
    type: { type: "string", enum: ["email-verification", "forget-password", "sign-in"] },
  },
} as const;

const registeredActorBodySchema = {
  type: "object",
  required: ["runId", "suite", "actor", "userId"],
  additionalProperties: false,
  properties: {
    runId: runRefBodySchema.properties.runId,
    suite: runRefBodySchema.properties.suite,
    actor: { type: "string", enum: ["learnerA"] },
    userId: { type: "string", minLength: 1 },
  },
} as const;

const storageObjectBodySchema = {
  type: "object",
  required: ["runId", "suite", "key"],
  additionalProperties: false,
  properties: {
    runId: runRefBodySchema.properties.runId,
    suite: runRefBodySchema.properties.suite,
    key: { type: "string", minLength: 1 },
  },
} as const;

const paymentSessionBodySchema = {
  type: "object",
  required: ["runId", "suite", "sessionId"],
  additionalProperties: false,
  properties: {
    runId: runRefBodySchema.properties.runId,
    suite: runRefBodySchema.properties.suite,
    sessionId: { type: "string", pattern: "^cs_test_[A-Za-z0-9_]+$" },
  },
} as const;

const paymentEventBodySchema = {
  type: "object",
  required: ["runId", "suite", "variant"],
  additionalProperties: false,
  properties: {
    runId: runRefBodySchema.properties.runId,
    suite: runRefBodySchema.properties.suite,
    variant: {
      type: "string",
      enum: ["paid", "unpaid", "wrong-owner", "wrong-course", "missing-metadata", "unknown-enrollment"],
    },
  },
} as const;

type BrunoPaymentEventVariant =
  | "paid"
  | "unpaid"
  | "wrong-owner"
  | "wrong-course"
  | "missing-metadata"
  | "unknown-enrollment";

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

    fastify.post<{ Body: RunRef }>("/runs/setup", { schema: { body: runRefBodySchema } }, async (request) =>
      dependencies.setupRun(validateRunRef(request.body))
    );

    fastify.post<{ Body: RunRef }>("/runs/cleanup", { schema: { body: runRefBodySchema } }, async (request) =>
      dependencies.cleanupRun(validateRunRef(request.body))
    );

    fastify.post<{ Body: RunRef & { actor: Actor; type: "email-verification" | "forget-password" | "sign-in" } }>(
      "/runs/otp",
      { schema: { body: runOtpBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        return dependencies.readRunOtp(ref, request.body.actor, request.body.type);
      }
    );

    fastify.post<{ Body: RunRef & { actor: "learnerA"; userId: string } }>(
      "/runs/actors/registered",
      { schema: { body: registeredActorBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        return dependencies.recordRegisteredActor(ref, request.body.actor, request.body.userId);
      }
    );

    fastify.post<{ Body: RunRef & { key: string } }>(
      "/runs/storage/track",
      { schema: { body: storageObjectBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        await dependencies.trackOwnedStorage(ref, request.body.key);
        return { tracked: true, key: request.body.key };
      }
    );

    fastify.post<{ Body: RunRef & { sessionId: string } }>(
      "/runs/payment/track",
      { schema: { body: paymentSessionBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        return dependencies.trackRunPaymentSession(ref, request.body.sessionId);
      }
    );

    fastify.post<{ Body: RunRef & { variant: BrunoPaymentEventVariant } }>(
      "/runs/payment/event",
      { schema: { body: paymentEventBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        return dependencies.buildRunPaymentEvent(ref, request.body.variant);
      }
    );

    fastify.post<{ Body: RunRef & { key: string } }>(
      "/runs/storage/inspect",
      { schema: { body: storageObjectBodySchema } },
      async (request) => {
        const ref = validateRunRef(request.body);
        return dependencies.inspectOwnedObject(ref, request.body.key);
      }
    );

    fastify.get("/storage-env", async () => {
      dependencies.assertBrunoStorageEnv();
      return { ok: true };
    });

    fastify.get("/payment-env", async () => {
      dependencies.assertBrunoPaymentEnv();
      return { ok: true };
    });
  };
}

export function defaultHelperRoutes() {
  return createBrunoDesktopRoutes({
    token: getBrunoDesktopHelpersConfig().token,
    setupRun,
    cleanupRun,
    assertBrunoStorageEnv,
    assertBrunoPaymentEnv,
    readRunOtp,
    recordRegisteredActor,
    trackOwnedStorage,
    inspectOwnedObject,
    trackRunPaymentSession,
    buildRunPaymentEvent,
  });
}
