import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import {
  BRUNO_AUTH_LIFECYCLE_EMAIL,
  type BrunoAuthLifecycleOtpType,
  getBrunoAuthLifecycleOtpIdentifier,
  parseBrunoAuthLifecycleOtpValue,
} from "./brunoAuthLifecycle.js";

type AuthLifecycleRuntimeEnv = Record<string, string | undefined>;

const allowedTypes = new Set<BrunoAuthLifecycleOtpType>([
  "email-verification",
  "sign-in",
  "forget-password",
  "change-email",
]);

export function getBrunoAuthLifecycleOtpType(env: AuthLifecycleRuntimeEnv = process.env) {
  const value = env.BRUNO_AUTH_LIFECYCLE_OTP_TYPE?.trim() || "forget-password";
  if (!allowedTypes.has(value as BrunoAuthLifecycleOtpType)) {
    throw new Error(`BRUNO_AUTH_LIFECYCLE_OTP_TYPE must be one of ${Array.from(allowedTypes).join(", ")}`);
  }
  return value as BrunoAuthLifecycleOtpType;
}

export async function readBrunoAuthLifecycleOtp(type: BrunoAuthLifecycleOtpType) {
  const identifier = getBrunoAuthLifecycleOtpIdentifier(type);
  const verification = await db.query.verification.findFirst({
    where: and(eq(schema.verification.identifier, identifier), gt(schema.verification.expiresAt, new Date())),
  });

  if (!verification) {
    throw new Error(`No unexpired Better Auth OTP found for ${identifier}`);
  }

  return parseBrunoAuthLifecycleOtpValue(verification.value);
}

export async function exportBrunoAuthLifecycleOtp(type = getBrunoAuthLifecycleOtpType()) {
  const lifecycleOtp = await readBrunoAuthLifecycleOtp(type);

  return {
    lifecycleEmail: BRUNO_AUTH_LIFECYCLE_EMAIL,
    lifecycleOtp,
  };
}
