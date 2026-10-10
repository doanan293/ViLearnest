import { and, eq, gt } from "drizzle-orm";
import * as schema from "../../backend/src/db/schema.js";
import { openIntegrationDatabase } from "../../backend/tests/support/integrationDatabase.js";
import { getBrunoAuthLifecycleOtpIdentifier, parseBrunoAuthLifecycleOtpValue } from "./brunoAuthLifecycle.js";
import { readRun } from "./fixtures/fixtures.js";
import type { Actor, RunRef } from "./fixtures/types.js";

const allowedRunOtpTypes = new Set(["email-verification", "forget-password", "sign-in"]);
type RunOtpType = "email-verification" | "forget-password" | "sign-in";
type Database = typeof import("../../backend/src/db/index.js").db;

async function withDatabase<T>(operation: (database: Database) => Promise<T>): Promise<T> {
  if (process.env.TEST_DATABASE_URL) {
    const integration = await openIntegrationDatabase();
    try {
      return await operation(integration.db as Database);
    } finally {
      await integration.close();
    }
  }
  const { db } = await import("../../backend/src/db/index.js");
  return operation(db);
}

export async function readRunOtp(ref: RunRef, actor: Actor, type: RunOtpType) {
  if (!allowedRunOtpTypes.has(type)) throw new Error("OTP type is not supported");
  const fixtures = await readRun(ref);
  const fixture = fixtures.actors[actor];

  return withDatabase(async (database) => {
    const user = await database.query.user.findFirst({
      where: and(eq(schema.user.id, fixture.id), eq(schema.user.email, fixture.email)),
    });
    if (!user) throw new Error("active run actor account was not found");

    const identifier = getBrunoAuthLifecycleOtpIdentifier(type, fixture.email);
    const verification = await database.query.verification.findFirst({
      where: and(eq(schema.verification.identifier, identifier), gt(schema.verification.expiresAt, new Date())),
    });
    if (!verification) throw new Error(`No unexpired Better Auth OTP found for ${identifier}`);

    return { email: fixture.email, otp: parseBrunoAuthLifecycleOtpValue(verification.value) };
  });
}
