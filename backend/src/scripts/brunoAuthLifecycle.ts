import { BRUNO_AUTH_LIFECYCLE_EMAIL } from "./brunoSeedData.js";

export { BRUNO_AUTH_LIFECYCLE_EMAIL };

export const BRUNO_AUTH_LIFECYCLE_INITIAL_PASSWORD = "BrunoPass123!";
export const BRUNO_AUTH_LIFECYCLE_RESET_PASSWORD = "BrunoResetPass123!";

export type BrunoAuthLifecycleOtpType = "email-verification" | "sign-in" | "forget-password" | "change-email";

export function getBrunoAuthLifecycleOtpIdentifier(
  type: BrunoAuthLifecycleOtpType,
  email = BRUNO_AUTH_LIFECYCLE_EMAIL
) {
  return `${type}-otp-${email.toLowerCase()}`;
}

export function parseBrunoAuthLifecycleOtpValue(value: string) {
  const separatorIndex = value.lastIndexOf(":");
  const otp = separatorIndex === -1 ? value : value.slice(0, separatorIndex);

  if (!otp) {
    throw new Error("Stored Bruno lifecycle OTP is empty");
  }

  return otp;
}
