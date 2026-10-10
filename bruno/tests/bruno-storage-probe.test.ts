import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DeleteObjectCommand, GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { readRunManifest, writeRunManifest } from "../tooling/fixtures/runStore.js";
import { BrunoStorageProbe } from "../tooling/fixtures/storageProbe.js";
import type { RunManifest, RunRef } from "../tooling/fixtures/types.js";

const ref: RunRef = { runId: "b23e4567-e89b-42d3-a456-426614174000", suite: "storage" };
const ownedKey = `uploads/123-${ref.runId}-upload.txt`;
const originalRunsDir = process.env.BRUNO_RUNS_DIR;
let runsDir = "";

function manifest(resources: RunManifest["resources"] = []): RunManifest {
  return {
    version: 1,
    status: "active",
    ref,
    actors: {
      admin: { id: "admin-id", email: "admin@example.com" },
      learnerA: { id: "learner-a-id", email: "a@example.com" },
      learnerB: { id: "learner-b-id", email: "b@example.com" },
    },
    ids: {},
    resources,
    retained: [],
  };
}

async function createProbe(response: unknown) {
  const send = jest.fn(async (_command: DeleteObjectCommand | GetObjectCommand) => response);
  const client = { send } as unknown as S3Client;
  return { probe: new BrunoStorageProbe(client, "bruno-test-bucket"), send };
}

afterEach(async () => {
  if (originalRunsDir === undefined) delete process.env.BRUNO_RUNS_DIR;
  else process.env.BRUNO_RUNS_DIR = originalRunsDir;
  if (runsDir) await rm(runsDir, { recursive: true, force: true });
});

describe("Bruno storage probe", () => {
  it("tracks only run-namespaced object filenames and rejects presigned URLs", async () => {
    runsDir = await mkdtemp(join(tmpdir(), "bruno-storage-probe-"));
    process.env.BRUNO_RUNS_DIR = runsDir;
    await writeRunManifest(ref, manifest());
    const { probe, send } = await createProbe({});

    await expect(probe.trackOwnedStorage(ref, "bruno-fixtures/foreign/foreign.txt")).rejects.toThrow(
      "storage resource is not owned by this run"
    );
    await expect(probe.trackOwnedStorage(ref, "https://bucket.example/object?signature=secret")).rejects.toThrow(
      "storage key must be a run-owned object key"
    );
    await expect(probe.trackOwnedStorage(ref, `uploads/123-foreign.txt`)).rejects.toThrow(
      "storage filename must contain the run ID"
    );
    expect(send).not.toHaveBeenCalled();
    expect((await readRunManifest(ref))?.resources).toEqual([]);
  });

  it("tracks and inspects a registered object's exact bytes, hash and content type", async () => {
    runsDir = await mkdtemp(join(tmpdir(), "bruno-storage-probe-"));
    process.env.BRUNO_RUNS_DIR = runsDir;
    await writeRunManifest(ref, manifest());
    const bytes = Buffer.from("owned Bruno storage bytes\n");
    const { probe, send } = await createProbe({
      Body: { transformToByteArray: async () => bytes },
      ContentType: "text/plain",
    });

    await probe.trackOwnedStorage(ref, ownedKey);
    const result = await probe.inspectOwnedObject(ref, ownedKey);

    expect(result).toEqual({
      exists: true,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      contentType: "text/plain",
      bytes: bytes.length,
    });
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[0]?.[0].input).toMatchObject({ Bucket: "bruno-test-bucket", Key: ownedKey });
  });

  it("maps provider NotFound to absence but propagates permission and transport errors", async () => {
    runsDir = await mkdtemp(join(tmpdir(), "bruno-storage-probe-"));
    process.env.BRUNO_RUNS_DIR = runsDir;
    await writeRunManifest(ref, manifest([{ kind: "storage", key: ownedKey }]));
    const notFound = Object.assign(new Error("missing"), { name: "NoSuchKey", $metadata: { httpStatusCode: 404 } });
    const missing = new BrunoStorageProbe(
      { send: jest.fn(async () => Promise.reject(notFound)) } as unknown as S3Client,
      "bruno-test-bucket"
    );
    const deniedError = Object.assign(new Error("denied"), {
      name: "AccessDenied",
      $metadata: { httpStatusCode: 403 },
    });
    const denied = new BrunoStorageProbe(
      { send: jest.fn(async () => Promise.reject(deniedError)) } as unknown as S3Client,
      "bruno-test-bucket"
    );
    const networkError = new Error("connection reset");
    const unavailable = new BrunoStorageProbe(
      { send: jest.fn(async () => Promise.reject(networkError)) } as unknown as S3Client,
      "bruno-test-bucket"
    );

    await expect(missing.inspectOwnedObject(ref, ownedKey)).resolves.toEqual({ exists: false });
    await expect(denied.inspectOwnedObject(ref, ownedKey)).rejects.toBe(deniedError);
    await expect(unavailable.inspectOwnedObject(ref, ownedKey)).rejects.toBe(networkError);
  });

  it("deletes only registered run objects and allows repeated cleanup", async () => {
    runsDir = await mkdtemp(join(tmpdir(), "bruno-storage-probe-"));
    process.env.BRUNO_RUNS_DIR = runsDir;
    await writeRunManifest(ref, manifest([{ kind: "storage", key: ownedKey }]));
    const { probe, send } = await createProbe({});

    await probe.deleteOwnedObject(ref, ownedKey);
    await probe.deleteOwnedObject(ref, ownedKey);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(DeleteObjectCommand);
    expect(send.mock.calls[0]?.[0].input).toMatchObject({ Bucket: "bruno-test-bucket", Key: ownedKey });
  });
});
