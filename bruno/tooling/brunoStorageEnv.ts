type StorageEnv = Record<string, string | undefined>;

const requiredStorageVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
] as const;

export function getMissingBrunoStorageEnv(env: StorageEnv = process.env) {
  const missing: string[] = requiredStorageVars.filter((name) => !env[name]?.trim());

  if (!env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES?.trim() && !env.AWS_BUCKET_NAME?.trim()) {
    missing.push("NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES or AWS_BUCKET_NAME");
  }

  return missing;
}

export function assertBrunoStorageEnv(env: StorageEnv = process.env) {
  const missing = getMissingBrunoStorageEnv(env);
  if (missing.length > 0) {
    throw new Error(`Bruno Phase B storage upload requires: ${missing.join(", ")}`);
  }
}
