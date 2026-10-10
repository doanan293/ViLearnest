import { existsSync } from "node:fs";
import { readdir, readFile, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const excluded = new Set([
  "node_modules",
  ".git",
  ".next",
  "coverage",
  "test-results",
  "playwright-report",
  "dist",
  "sample-courses",
]);
async function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.(?:[cm]?[jt]s|tsx|jsx)$/.test(entry.name) && !/\.d\.[cm]?ts$/.test(entry.name)) files.push(path);
  }
  return files;
}
function options(root, owner) {
  const config = join(root, owner, "tsconfig.json");
  if (!existsSync(config)) return { moduleResolution: ts.ModuleResolutionKind.NodeNext };
  const read = ts.readConfigFile(config, ts.sys.readFile);
  if (read.error) throw new Error(`Cannot read ${owner}/tsconfig.json`);
  return ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(config)).options;
}
function imports(file, source) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const values = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      values.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      values.push(node.arguments[0].text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    )
      values.push(node.argument.literal.text);
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return values;
}
function violation(importer, target) {
  const product = /^(backend|frontend)\/src\//.test(importer) && !importer.startsWith("frontend/src/test-utils/");
  if (
    product &&
    (/^(backend|frontend)\/tests\//.test(target) ||
      target.startsWith("frontend/src/test-utils/") ||
      target.startsWith("bruno/"))
  )
    return "Product code cannot import test or Bruno tooling";
  if (importer.startsWith("frontend/") && /^(backend|bruno)\//.test(target))
    return "Frontend cannot import backend or Bruno source";
  if (importer.startsWith("backend/") && target.startsWith("frontend/")) return "Backend cannot import frontend source";
  if (importer.startsWith("backend/tests/") && target.startsWith("bruno/")) return "Backend tests cannot import Bruno";
  return undefined;
}
/** @param {string} root @returns {Promise<Array<{importer: string, target: string, rule: string}>>} */
export async function checkBoundaries(root) {
  root = await realpath(root);
  const errors = [];
  for (const owner of ["backend", "frontend", "bruno"]) {
    const compiler = options(root, owner);
    for (const file of await sourceFiles(join(root, owner))) {
      const importer = relative(root, file).replaceAll("\\", "/");
      for (const specifier of imports(file, await readFile(file, "utf8"))) {
        const module = ts.resolveModuleName(specifier, file, compiler, ts.sys).resolvedModule;
        const fallback = specifier.startsWith(".") ? resolve(dirname(file), specifier) : undefined;
        const found = module?.resolvedFileName ?? (fallback && existsSync(fallback) ? fallback : undefined);
        if (!found) continue;
        const target = relative(root, await realpath(found)).replaceAll("\\", "/");
        const rule = violation(importer, target);
        if (rule) errors.push({ importer, target, rule });
      }
    }
  }
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const errors = await checkBoundaries(root);
  for (const error of errors) console.error(`${error.importer} -> ${error.target}: ${error.rule}`);
  console.log(`Architecture boundaries: ${errors.length} violation(s)`);
  process.exitCode = errors.length ? 1 : 0;
}
