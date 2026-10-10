export type BrunoAuthLifecycleOtpType = "email-verification" | "sign-in" | "forget-password" | "change-email";

export function getBrunoAuthLifecycleOtpIdentifier(type: BrunoAuthLifecycleOtpType, email: string) {
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
