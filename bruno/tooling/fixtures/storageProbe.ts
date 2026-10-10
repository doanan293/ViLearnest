import { createHash } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../../../backend/src/config/index.js";
import { readRunManifest, updateRunManifest, validateRunRef } from "./runStore.js";
import type { RunRef } from "./types.js";

export type StorageInspection =
  | { exists: false }
  | { exists: true; sha256: string; contentType?: string; bytes: number };

export function assertOwnedStorageKey(value: RunRef, key: string) {
  const ref = validateRunRef(value);
  if (typeof key !== "string" || key.includes("://") || key.includes("?") || key.includes("#")) {
    throw new Error("storage key must be a run-owned object key");
  }

  const prefix = "uploads/";
  if (!key.startsWith(prefix)) throw new Error("storage resource is not owned by this run");
  const filename = key.slice(prefix.length);
  if (
    !filename ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename === "." ||
    filename === ".." ||
    [...filename].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  ) {
    throw new Error("storage key must be a run-owned object key");
  }
  if (!new RegExp(`^\\d+-${ref.runId}-.+$`).test(filename)) {
    throw new Error("storage filename must contain the run ID");
  }
  return { ref, key };
}

function isNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return value.$metadata?.httpStatusCode === 404 || value.name === "NoSuchKey" || value.name === "NotFound";
}

async function objectBytes(body: unknown): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body;
  if (body && typeof body === "object" && "transformToByteArray" in body) {
    const transform = (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray;
    if (transform) return transform.call(body);
  }
  throw new Error("storage provider returned an unreadable object body");
}

export class BrunoStorageProbe {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string
  ) {}

  async trackOwnedStorage(value: RunRef, key: string): Promise<void> {
    const { ref } = assertOwnedStorageKey(value, key);
    await updateRunManifest(ref, (manifest) => {
      if (manifest.status !== "active") throw new Error("active run was not found");
      const resource = { kind: "storage" as const, key };
      if (manifest.resources.some((entry) => entry.kind === "storage" && entry.key === key)) return manifest;
      return { ...manifest, resources: [...manifest.resources, resource] };
    });
  }

  async inspectOwnedObject(value: RunRef, key: string): Promise<StorageInspection> {
    const { ref } = assertOwnedStorageKey(value, key);
    const manifest = await readRunManifest(ref);
    if (
      !manifest ||
      manifest.status === "cleaned" ||
      !manifest.resources.some((resource) => resource.kind === "storage" && resource.key === key)
    ) {
      throw new Error("storage object is not registered to this run");
    }

    try {
      const result = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await objectBytes(result.Body);
      return {
        exists: true,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        contentType: result.ContentType,
        bytes: bytes.byteLength,
      };
    } catch (error) {
      if (isNotFound(error)) return { exists: false };
      throw error;
    }
  }

  async deleteOwnedObject(value: RunRef, key: string): Promise<void> {
    const { ref } = assertOwnedStorageKey(value, key);
    const manifest = await readRunManifest(ref);
    if (
      !manifest ||
      manifest.status === "cleaned" ||
      !manifest.resources.some((resource) => resource.kind === "storage" && resource.key === key)
    ) {
      throw new Error("storage object is not registered to this run");
    }
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

const storageProbe = new BrunoStorageProbe(
  new S3Client({
    region: config.awsRegion,
    endpoint: config.awsEndpointUrlS3,
    forcePathStyle: false,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  }),
  config.s3BucketName
);

export const trackOwnedStorage = (ref: RunRef, key: string) => storageProbe.trackOwnedStorage(ref, key);
export const inspectOwnedObject = (ref: RunRef, key: string) => storageProbe.inspectOwnedObject(ref, key);
export const deleteOwnedObject = (ref: RunRef, key: string) => storageProbe.deleteOwnedObject(ref, key);
