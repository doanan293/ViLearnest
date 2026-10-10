import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturesDir = path.join(rootDir, "bruno", "fixtures");
const sampleCoursesDir = path.join(rootDir, "backend", "sample-courses");

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
}

function findSmallestSampleMp4() {
  const candidates = walkFiles(sampleCoursesDir)
    .filter((filePath) => filePath.toLowerCase().endsWith(".mp4"))
    .map((filePath) => ({ filePath, size: fs.statSync(filePath).size }))
    .sort((left, right) => left.size - right.size);

  const selected = candidates[0];
  if (!selected) {
    throw new Error("No sample MP4 file found for Bruno fixture generation");
  }

  return selected.filePath;
}

fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(path.join(fixturesDir, "course-cover.png"), onePixelPng);
fs.writeFileSync(path.join(fixturesDir, "lesson-thumbnail.png"), onePixelPng);
fs.writeFileSync(path.join(fixturesDir, "upload-smoke.txt"), "Bruno storage smoke fixture\n");
fs.copyFileSync(findSmallestSampleMp4(), path.join(fixturesDir, "lesson-video.mp4"));

console.log("Bruno fixtures generated in bruno/fixtures");
