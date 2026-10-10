import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRUNO_SUITES, type RunManifest, type RunRef, type SuiteName } from "./types.js";

const manifestVersion = 1;
const runLocks = new Map<string, Promise<void>>();
const defaultRunStore = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.bruno-runs");

export function validateRunRef(value: unknown): RunRef {
  if (!value || typeof value !== "object") throw new Error("run reference is required");
  const ref = value as Partial<RunRef>;
  if (
    typeof ref.runId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ref.runId)
  ) {
    throw new Error("runId must be a UUID");
  }
  if (typeof ref.suite !== "string" || !BRUNO_SUITES.includes(ref.suite as SuiteName)) {
    throw new Error("suite is not supported");
  }
  return { runId: ref.runId.toLowerCase(), suite: ref.suite as SuiteName };
}

export function runManifestPath(value: unknown, root = process.env.BRUNO_RUNS_DIR || ".bruno-runs") {
  const ref = validateRunRef(value);
  const storeRoot = process.env.BRUNO_RUNS_DIR
    ? resolve(root)
    : root === ".bruno-runs"
      ? defaultRunStore
      : resolve(root);
  return join(storeRoot, `${ref.runId}.${ref.suite}.json`);
}

export async function readRunManifest(value: unknown, root?: string): Promise<RunManifest | null> {
  const path = runManifestPath(value, root);
  try {
    const manifest = JSON.parse(await readFile(path, "utf8")) as RunManifest;
    const ref = validateRunRef(manifest.ref);
    const requestedRef = validateRunRef(value);
    if (manifest.version !== manifestVersion || ref.runId !== requestedRef.runId || ref.suite !== requestedRef.suite) {
      throw new Error("run manifest does not match the requested run");
    }
    if (!manifest.status || !Array.isArray(manifest.resources) || !manifest.actors || !manifest.ids) {
      throw new Error("run manifest is invalid");
    }
    return manifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeRunManifest(value: unknown, manifest: RunManifest, root?: string) {
  const ref = validateRunRef(value);
  const path = runManifestPath(ref, root);
  if (validateRunRef(manifest.ref).runId !== ref.runId || manifest.ref.suite !== ref.suite) {
    throw new Error("run manifest does not match the requested run");
  }
  if (/(?:password|token|otp|secret|signature|authorization)/i.test(JSON.stringify(manifest))) {
    throw new Error("run manifests cannot contain credentials or signed values");
  }
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600, flag: "wx" });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function updateRunManifest(value: unknown, update: (manifest: RunManifest) => RunManifest, root?: string) {
  const ref = validateRunRef(value);
  return withRunLock(
    ref,
    async () => {
      const manifest = await readRunManifest(ref, root);
      if (!manifest) throw new Error("run manifest was not found");
      const next = update(manifest);
      await writeRunManifest(ref, next, root);
      return next;
    },
    root
  );
}

export async function withRunLock<T>(value: unknown, operation: () => Promise<T> | T, root?: string): Promise<T> {
  const key = runManifestPath(value, root);
  const previous = runLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolveLock) => {
    release = resolveLock;
  });
  const queued = previous.then(() => current);
  runLocks.set(key, queued);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (runLocks.get(key) === queued) runLocks.delete(key);
  }
}
