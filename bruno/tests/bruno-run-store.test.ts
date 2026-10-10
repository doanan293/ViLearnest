import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "@jest/globals";
import {
  readRunManifest,
  runManifestPath,
  updateRunManifest,
  validateRunRef,
  withRunLock,
  writeRunManifest,
} from "../tooling/fixtures/runStore.js";
import type { RunManifest, RunRef } from "../tooling/fixtures/types.js";

const runA: RunRef = { runId: "123e4567-e89b-42d3-a456-426614174000", suite: "profile" };
const runB: RunRef = { runId: "223e4567-e89b-42d3-a456-426614174000", suite: "profile" };
let storeDir: string;

function manifest(ref: RunRef): RunManifest {
  return {
    version: 1 as const,
    status: "active" as const,
    ref,
    actors: {
      admin: { id: "admin-id", email: "admin@example.com" },
      learnerA: { id: "learner-a-id", email: "a@example.com" },
      learnerB: { id: "learner-b-id", email: "b@example.com" },
    },
    ids: {},
    resources: [],
    retained: [],
  };
}

async function createStore() {
  storeDir = await mkdtemp(join(tmpdir(), "bruno-run-store-"));
  return storeDir;
}

afterEach(async () => {
  if (storeDir) await rm(storeDir, { recursive: true, force: true });
});

describe("Bruno run store", () => {
  it("rejects malformed run IDs and unsupported suite names", () => {
    expect(() => validateRunRef({ runId: "../../production", suite: "profile" })).toThrow("runId must be a UUID");
    expect(() => validateRunRef({ runId: runA.runId, suite: "all" })).toThrow("suite is not supported");
  });

  it("stores manifests in the repository root so workspace commands share one ignored location", () => {
    expect(runManifestPath(runA)).toBe(join(process.cwd(), ".bruno-runs", `${runA.runId}.profile.json`));
  });

  it("keeps two run manifests isolated and excludes credentials from disk", async () => {
    const root = await createStore();
    await writeRunManifest(runA, manifest(runA), root);
    await writeRunManifest(runB, manifest(runB), root);

    expect(await readRunManifest(runA, root)).toMatchObject({ ref: runA });
    expect(await readRunManifest(runB, root)).toMatchObject({ ref: runB });
    expect(await readFile(join(root, `${runA.runId}.profile.json`), "utf8")).not.toMatch(/password|token|otp/i);
  });

  it("serializes operations for one run while allowing other run IDs through", async () => {
    const root = await createStore();
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = withRunLock(
      runA,
      async () => {
        order.push("a-start");
        await gate;
        order.push("a-end");
      },
      root
    );
    const second = withRunLock(
      runA,
      async () => {
        order.push("b");
      },
      root
    );
    const independent = withRunLock(runB, async () => order.push("c"), root);

    await independent;
    expect(order).toEqual(["a-start", "c"]);
    release();
    await Promise.all([first, second]);
    expect(order).toEqual(["a-start", "c", "a-end", "b"]);
  });

  it("updates one manifest atomically with deduplicated owned resources", async () => {
    const root = await createStore();
    await writeRunManifest(runA, manifest(runA), root);
    await updateRunManifest(
      runA,
      (manifest) => ({
        ...manifest,
        resources: [...manifest.resources, { kind: "database", id: "course-1" }],
      }),
      root
    );

    expect(await readRunManifest(runA, root)).toMatchObject({ resources: [{ kind: "database", id: "course-1" }] });
  });

  it("refuses to persist passwords, tokens, OTPs, or signatures", async () => {
    const root = await createStore();

    await expect(
      writeRunManifest(
        runA,
        {
          ...manifest(runA),
          actors: { ...manifest(runA).actors, admin: { ...manifest(runA).actors.admin, password: "secret" } },
        } as never,
        root
      )
    ).rejects.toThrow("cannot contain credentials");
  });
});
