import { afterAll, describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import * as schema from "../../../backend/src/db/schema.js";
import { openIntegrationDatabase } from "../../../backend/tests/support/integrationDatabase.js";
import { getBrunoAuthLifecycleOtpIdentifier } from "../../tooling/brunoAuthLifecycle.js";
import { readRunOtp } from "../../tooling/brunoAuthLifecycleRuntime.js";
import { cleanupRun, recordRegisteredActor, setupRun } from "../../tooling/fixtures/fixtures.js";
import type { RunRef } from "../../tooling/fixtures/types.js";

const runA: RunRef = { runId: "623e4567-e89b-42d3-a456-426614174000", suite: "auth" };
const runB: RunRef = { runId: "723e4567-e89b-42d3-a456-426614174000", suite: "auth" };
const registeredUserId = "bruno-auth-runtime-registered-user-a";
const foreignUserId = "bruno-auth-runtime-registered-user-b";

describe("run-owned authentication runtime", () => {
  afterAll(async () => {
    await cleanupRun(runA).catch(() => undefined);
    await cleanupRun(runB).catch(() => undefined);
    const integration = await openIntegrationDatabase();
    try {
      await integration.db.delete(schema.user).where(eq(schema.user.id, foreignUserId));
    } finally {
      await integration.close();
    }
  });

  it("returns an OTP only for the active run actor and persists registration ownership", async () => {
    const integration = await openIntegrationDatabase();
    try {
      const fixturesA = await setupRun(runA);
      const fixturesB = await setupRun(runB);
      const email = fixturesA.actors.learnerA.email;
      await integration.db.insert(schema.user).values({
        id: foreignUserId,
        name: "Registered Bruno Learner B",
        email: fixturesB.actors.learnerA.email,
        emailVerified: false,
        role: "user",
      });
      await integration.db.insert(schema.user).values({
        id: registeredUserId,
        name: "Registered Bruno Learner A",
        email,
        emailVerified: false,
        role: "user",
      });
      await integration.db.insert(schema.verification).values({
        id: `${registeredUserId}-email-otp`,
        identifier: getBrunoAuthLifecycleOtpIdentifier("email-verification", email),
        value: "123456:0",
        expiresAt: new Date(Date.now() + 60_000),
      });

      await recordRegisteredActor(runB, "learnerA", foreignUserId);
      await expect(recordRegisteredActor(runA, "learnerA", registeredUserId)).resolves.toMatchObject({
        id: registeredUserId,
      });
      await expect(readRunOtp(runA, "learnerA", "email-verification")).resolves.toEqual({ email, otp: "123456" });
      await expect(readRunOtp(runA, "learnerB", "email-verification")).rejects.toThrow("No unexpired Better Auth OTP");
      await expect(readRunOtp(runB, "learnerA", "email-verification")).rejects.toThrow("No unexpired Better Auth OTP");
      await expect(readRunOtp(runA, "learnerA", "change-email" as never)).rejects.toThrow("OTP type is not supported");
      await expect(recordRegisteredActor(runA, "learnerA", foreignUserId)).rejects.toThrow(
        "registered account does not belong to this run actor"
      );

      const manifest = await integration.db.query.user.findFirst({ where: eq(schema.user.id, registeredUserId) });
      expect(manifest?.email).toBe(email);
    } finally {
      await integration.close();
    }
  });
});
