import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "@jest/globals";
import { checkBoundaries } from "../../scripts/check-boundaries.mjs";

it("rejects cross-owner imports including aliases, type imports and dynamic imports", async () => {
  const root = await mkdtemp(join(tmpdir(), "lms-boundaries-"));
  async function file(name: string, text: string) {
    const path = join(root, name);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, text);
  }
  try {
    await file(
      "frontend/tsconfig.json",
      JSON.stringify({ compilerOptions: { paths: { "@be/*": ["../backend/src/*"] } } })
    );
    await file("backend/tsconfig.json", "{}");
    await file("bruno/tsconfig.json", "{}");
    await file("backend/src/value.ts", "export const value = 1;");
    await file("backend/tests/support/data.ts", "export const data = 1;");
    await file("bruno/tooling/value.ts", "export const value = 1;");
    await file("backend/tests/unit/wrong.ts", 'import type { value } from "../../../bruno/tooling/value.js";');
    await file(
      "backend/tests/unit/import-type.ts",
      'export type Remote = import("../../../bruno/tooling/value.js").value;'
    );
    await file(
      "backend/tests/unit/typeof-import.ts",
      'export type Remote = typeof import("../../../bruno/tooling/value.js");'
    );
    await file("backend/src/wrong.ts", 'export { data } from "../tests/support/data.js";');
    await file("frontend/src/wrong.ts", 'import { value } from "@be/value";');
    await file("backend/tests/support/wrong.ts", 'const data = import("../../../bruno/tooling/value.js");');
    await file("frontend/src/dynamic.ts", 'const data = require("../../backend/src/value.js");');
    await file(
      "bruno/tooling/allowed.ts",
      'import { data } from "../../backend/tests/support/data.js"; const comment = "../../frontend/src/value.js";'
    );
    const errors = await checkBoundaries(root);
    expect(errors.map((error) => error.importer).sort()).toEqual([
      "backend/src/wrong.ts",
      "backend/tests/support/wrong.ts",
      "backend/tests/unit/import-type.ts",
      "backend/tests/unit/typeof-import.ts",
      "backend/tests/unit/wrong.ts",
      "frontend/src/dynamic.ts",
      "frontend/src/wrong.ts",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
