#!/usr/bin/env node
import { spawn } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_ROOT = path.join(ROOT_DIR, "sample-courses");
const OUTPUT_TEMPLATE = "%(playlist_index)03d-%(title).200B.%(ext)s";
const DEFAULT_CHAPTER_TITLE = "Nội dung khóa học";
const DEFAULT_SMALL_DESCRIPTION =
  "Khóa học gồm các bài học video được sắp xếp theo lộ trình, giúp người học nắm vững nội dung từ nền tảng đến thực hành.";
const DEFAULT_COURSE_TITLE = "YouTube Playlist Course";
const COURSE_DESCRIPTION_FALLBACK = DEFAULT_SMALL_DESCRIPTION;

const SAMPLE_PLAYLISTS = [
  {
    slug: "openai-codex-tutorial",
    title: "OpenAI Codex Tutorial",
    topic: "AI Coding",
    url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9iDBeA8IyR1IE1kl4w5IDEG",
  },
  {
    slug: "vibe-coding-ai-studio",
    title: "Vibe Coding in AI Studio",
    topic: "AI Coding",
    url: "https://www.youtube.com/playlist?list=PLOU2XLYxmsIKkEa_-KTPF9DZ0IyHJ7V1H",
  },
  {
    slug: "ai-in-100-seconds",
    title: "100 Seconds of Artificial Intelligence",
    topic: "Artificial Intelligence",
    url: "https://www.youtube.com/playlist?list=PLRyUyuwz4_7rR4j962NwSDErsD0a0Hnzu",
  },
  {
    slug: "github-copilot-cli",
    title: "GitHub Copilot CLI for Beginners",
    topic: "Developer Tools",
    url: "https://www.youtube.com/playlist?list=PL0lo9MOBetEHvO-spzKBAITkkTqv4RvNl",
  },
  {
    slug: "ai-fast",
    title: "AI Fast",
    topic: "AI Development",
    url: "https://www.youtube.com/playlist?list=PLx_VinYHw1-i88YRfpEWbOQyM_k8MKCPF",
  },
];

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugifyTitle(value, fallback = "youtube-playlist-course") {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || fallback;
}

function firstSentence(value, fallback) {
  const text = cleanText(value);
  if (!text) return fallback;

  const sentence = text.match(/^.{1,180}?(?:[.!?。]|$)/u)?.[0]?.trim();
  return sentence || text.slice(0, 180).trim();
}

function buildCourseMarkdown({ title, description }) {
  const safeTitle = cleanText(title) || DEFAULT_COURSE_TITLE;
  const body = cleanText(description) || COURSE_DESCRIPTION_FALLBACK;

  return `# ${safeTitle}\n\n${body}\n`;
}

function buildLessonMarkdown({ title, description }) {
  const safeTitle = cleanText(title) || "Untitled Lesson";
  const body = cleanText(description) || "Nội dung bài học sẽ được bổ sung trong quá trình biên tập khóa học.";

  return `# ${safeTitle}\n\n${body}\n`;
}

function resolveManifestPlaylistId(playlistUrl, playlistMetadata) {
  if (cleanText(playlistMetadata?.id)) return cleanText(playlistMetadata.id);

  try {
    const parsed = new URL(playlistUrl);
    return parsed.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

function resolveCourseTitle(playlistId, playlistMetadata) {
  const title = cleanText(playlistMetadata?.title);
  if (title) return title;
  if (playlistId) return `YouTube Playlist ${playlistId}`;
  return DEFAULT_COURSE_TITLE;
}

function buildManifest({ playlistUrl, playlistMetadata, videos, generatedAt = new Date().toISOString() }) {
  const playlistId = resolveManifestPlaylistId(playlistUrl, playlistMetadata);
  const courseTitle = resolveCourseTitle(playlistId, playlistMetadata);
  const playlistDescription = cleanText(playlistMetadata?.description);
  const lessons = videos.map((video, index) => ({
    title: cleanText(video.title) || `Lesson ${index + 1}`,
    position: index + 1,
    descriptionMarkdownPath: video.files.descriptionMarkdownPath,
    videoFile: video.files.videoFile,
    ...(video.files.thumbnailFile ? { thumbnailFile: video.files.thumbnailFile } : {}),
    ...(Number.isFinite(video.duration) ? { durationSeconds: Number(video.duration) } : {}),
    source: {
      youtubeVideoId: cleanText(video.id),
      youtubeUrl: cleanText(video.webpage_url) || (video.id ? `https://www.youtube.com/watch?v=${video.id}` : ""),
      rawMetadataFile: video.files.rawMetadataFile,
    },
  }));

  const durationSeconds = lessons.reduce((total, lesson) => total + (lesson.durationSeconds || 0), 0);

  return {
    schemaVersion: 1,
    generatedAt,
    course: {
      title: courseTitle,
      slug: slugifyTitle(courseTitle),
      smallDescription: firstSentence(playlistDescription, DEFAULT_SMALL_DESCRIPTION),
      descriptionMarkdownPath: "course.md",
      category: "Web Development",
      level: "Beginner",
      status: "Draft",
      price: 0,
      duration: Math.ceil(durationSeconds / 60),
    },
    chapters: [
      {
        title: DEFAULT_CHAPTER_TITLE,
        position: 1,
        lessons,
      },
    ],
    source: {
      type: "youtube",
      playlistId,
      playlistUrl,
      downloadedAt: generatedAt,
    },
  };
}

function validateManifest(manifest) {
  const errors = [];

  if (manifest?.schemaVersion !== 1) errors.push("manifest.schemaVersion must be 1");
  if (!cleanText(manifest?.course?.title)) errors.push("manifest.course.title is required");
  if (!cleanText(manifest?.course?.slug)) errors.push("manifest.course.slug is required");
  if (!cleanText(manifest?.course?.smallDescription)) errors.push("manifest.course.smallDescription is required");
  if (manifest?.course?.smallDescription === "Imported from YouTube playlist") {
    errors.push("manifest.course.smallDescription must be course-facing");
  }
  if (!Array.isArray(manifest?.chapters) || manifest.chapters.length !== 1) {
    errors.push("manifest.chapters must contain exactly one chapter for this phase");
  }

  const lessons = manifest?.chapters?.[0]?.lessons;
  if (!Array.isArray(lessons) || lessons.length === 0) {
    errors.push("manifest.chapters[0].lessons must contain at least one lesson");
    return errors;
  }

  lessons.forEach((lesson, index) => {
    const expectedPosition = index + 1;
    if (lesson.position !== expectedPosition) {
      errors.push(`lesson ${expectedPosition} position must be ${expectedPosition}`);
    }
    if (!cleanText(lesson.title)) errors.push(`lesson ${expectedPosition} title is required`);
    if (!cleanText(lesson.videoFile)) errors.push(`lesson ${expectedPosition} videoFile is required`);
    if (!cleanText(lesson.descriptionMarkdownPath)) {
      errors.push(`lesson ${expectedPosition} descriptionMarkdownPath is required`);
    }
    if (!cleanText(lesson.source?.youtubeVideoId)) {
      errors.push(`lesson ${expectedPosition} source.youtubeVideoId is required`);
    }
  });

  return errors;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.stdio ?? "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} exited with code ${code}${stderr ? `: ${stderr}` : ""}`));
    });
  });
}

async function commandExists(tool) {
  try {
    await run(tool, [tool === "ffmpeg" ? "-version" : "--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function requireTools({ commandExists: exists = commandExists, fullDownload = true } = {}) {
  const requiredTools = fullDownload ? ["yt-dlp", "ffmpeg"] : ["yt-dlp"];
  const checks = await Promise.all(requiredTools.map(async (tool) => [tool, await exists(tool)]));
  return checks.filter(([, exists]) => !exists).map(([tool]) => tool);
}

async function ensureOutputDirectories(outputDir) {
  await Promise.all([
    mkdir(outputDir, { recursive: true }),
    mkdir(path.join(outputDir, "raw", "videos"), { recursive: true }),
    mkdir(path.join(outputDir, "videos"), { recursive: true }),
    mkdir(path.join(outputDir, "thumbnails"), { recursive: true }),
    mkdir(path.join(outputDir, "lessons"), { recursive: true }),
  ]);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolvePlaylistId(playlistUrl) {
  try {
    const parsed = new URL(playlistUrl);
    return parsed.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

export function validatePlaylistMetadataEntries(playlistMetadata) {
  const entries = playlistMetadata?.entries;
  const playlistCount = Number(playlistMetadata?.playlist_count ?? 0);
  if (!Array.isArray(entries) || entries.length > 0 || playlistCount <= 0) return;

  const title = cleanText(playlistMetadata?.title) || cleanText(playlistMetadata?.id) || "YouTube playlist";
  const version = cleanText(playlistMetadata?._version?.version);
  const versionLabel = version ? `yt-dlp ${version}` : "yt-dlp";
  throw new Error(
    `${versionLabel} could not read any videos from playlist "${title}" even though YouTube reports ${playlistCount} videos. Update yt-dlp and run this command again.`
  );
}

async function readPreparedPlaylistManifest({ outputDir, playlistUrl }) {
  const manifestPath = path.join(outputDir, "manifest.json");
  if (!(await fileExists(manifestPath))) return undefined;

  const manifest = await readJson(manifestPath);
  const expectedPlaylistId = resolvePlaylistId(playlistUrl);
  const manifestPlaylistId = manifest?.source?.playlistId || resolvePlaylistId(manifest?.source?.playlistUrl || "");
  const playlistMatches = expectedPlaylistId
    ? manifestPlaylistId === expectedPlaylistId
    : manifest?.source?.playlistUrl === playlistUrl;
  if (!playlistMatches) return undefined;

  const lessons = manifest?.chapters?.flatMap((chapter) => chapter.lessons ?? []) ?? [];
  if (lessons.length === 0) return undefined;

  for (const lesson of lessons) {
    if (!lesson.videoFile || !(await fileExists(path.join(outputDir, lesson.videoFile)))) {
      return undefined;
    }
  }

  return manifest;
}

export async function hasPreparedPlaylistOutput({ outputDir, playlistUrl }) {
  return Boolean(await readPreparedPlaylistManifest({ outputDir, playlistUrl }));
}

function stripInfoJsonSuffix(fileName) {
  return fileName.endsWith(".info.json") ? fileName.slice(0, -".info.json".length) : fileName;
}

async function listFilesRecursive(rootDir) {
  const files = [];
  if (!(await fileExists(rootDir))) return files;

  async function visit(currentDir, relativeDir = "") {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = path.join(relativeDir, entry.name);
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await visit(rootDir);
  return files.sort();
}

async function findExistingRelativeFile(outputDir, directory, stem, extensions) {
  const files = await listFilesRecursive(path.join(outputDir, directory));
  for (const relativeFile of files) {
    const parsed = path.parse(relativeFile);
    if (parsed.name === stem && extensions.includes(parsed.ext.slice(1))) {
      return path.join(directory, relativeFile);
    }
  }

  return undefined;
}

async function collectVideoInfoFiles(outputDir) {
  const rawVideosDir = path.join(outputDir, "raw", "videos");
  const entries = await listFilesRecursive(rawVideosDir);
  const infoFilesByStem = new Map();
  for (const entry of entries.filter((fileName) => fileName.endsWith(".info.json"))) {
    const stem = stripInfoJsonSuffix(path.basename(entry));
    const existing = infoFilesByStem.get(stem);
    if (!existing || entry.split(path.sep).length < existing.split(path.sep).length) {
      infoFilesByStem.set(stem, entry);
    }
  }

  return [...infoFilesByStem.values()].sort((left, right) => {
    const leftStem = stripInfoJsonSuffix(path.basename(left));
    const rightStem = stripInfoJsonSuffix(path.basename(right));
    return leftStem.localeCompare(rightStem);
  });
}

export async function collectVideoMetadata(outputDir, { requireVideoFiles = true } = {}) {
  const rawVideosDir = path.join(outputDir, "raw", "videos");
  const infoFiles = await collectVideoInfoFiles(outputDir);

  const videos = [];
  for (const fileName of infoFiles) {
    const metadata = await readJson(path.join(rawVideosDir, fileName));
    const stem = stripInfoJsonSuffix(path.basename(fileName));
    const videoFile =
      (await findExistingRelativeFile(outputDir, "videos", stem, ["mp4"])) ?? `videos/${stem}.mp4`;
    const thumbnailFile = await findExistingRelativeFile(outputDir, "thumbnails", stem, ["jpg", "jpeg", "webp", "png"]);

    videos.push({
      ...metadata,
      files: {
        videoFile,
        ...(thumbnailFile ? { thumbnailFile } : {}),
        descriptionMarkdownPath: `lessons/${stem}.md`,
        rawMetadataFile: path.join("raw", "videos", fileName),
      },
    });
  }

  if (!requireVideoFiles) return videos;

  const videosWithExistingFiles = [];
  for (const video of videos) {
    if (await fileExists(path.join(outputDir, video.files.videoFile))) {
      videosWithExistingFiles.push(video);
    }
  }

  return videosWithExistingFiles;
}

async function writeMarkdownFiles(outputDir, playlistMetadata, videos) {
  await writeFile(
    path.join(outputDir, "course.md"),
    buildCourseMarkdown({
      title: playlistMetadata.title,
      description: playlistMetadata.description,
    }),
    "utf8"
  );

  for (const video of videos) {
    await writeFile(
      path.join(outputDir, video.files.descriptionMarkdownPath),
      buildLessonMarkdown({
        title: video.title,
        description: video.description,
      }),
      "utf8"
    );
  }
}

async function downloadPlaylistMetadata({ playlistUrl, outputDir }) {
  await run("yt-dlp", [
    "--yes-playlist",
    "--skip-download",
    "--write-info-json",
    "--clean-info-json",
    "--paths",
    `home:${outputDir}`,
    "--paths",
    `infojson:${path.join(outputDir, "raw", "videos")}`,
    "--output",
    OUTPUT_TEMPLATE,
    playlistUrl,
  ]);
}

async function downloadPlaylistMedia({ playlistUrl, outputDir }) {
  await run("yt-dlp", [
    "--yes-playlist",
    "--ignore-errors",
    "--download-archive",
    path.join(outputDir, "download-archive.txt"),
    "--format",
    "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080]/best",
    "--merge-output-format",
    "mp4",
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "--write-info-json",
    "--clean-info-json",
    "--paths",
    `home:${path.join(outputDir, "videos")}`,
    "--paths",
    `thumbnail:${path.join(outputDir, "thumbnails")}`,
    "--paths",
    `infojson:${path.join(outputDir, "raw", "videos")}`,
    "--output",
    OUTPUT_TEMPLATE,
    playlistUrl,
  ]);
}

async function getPlaylistMetadata({ playlistUrl }) {
  const result = await run("yt-dlp", ["--dump-single-json", "--flat-playlist", "--yes-playlist", playlistUrl], {
    stdio: "pipe",
  });
  const playlistMetadata = JSON.parse(result.stdout);
  validatePlaylistMetadataEntries(playlistMetadata);
  return playlistMetadata;
}

async function writeManifest({ playlistUrl, outputDir, generatedAt, requireVideoFiles = true, playlistMetadata }) {
  playlistMetadata ??= await getPlaylistMetadata({ playlistUrl });
  const videos = await collectVideoMetadata(outputDir, { requireVideoFiles });
  await writeMarkdownFiles(outputDir, playlistMetadata, videos);

  const manifest = buildManifest({
    playlistUrl,
    playlistMetadata,
    videos,
    generatedAt,
  });
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Manifest validation failed:\n- ${errors.join("\n- ")}`);
  }

  await writeFile(path.join(outputDir, "raw", "playlist.info.json"), `${JSON.stringify(playlistMetadata, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

export async function prepareSampleCourse(options) {
  const preparedManifest = await readPreparedPlaylistManifest({
    outputDir: options.outputDir,
    playlistUrl: options.playlistUrl,
  });
  if (preparedManifest) {
    return {
      ...preparedManifest,
      skipped: true,
    };
  }

  await ensureOutputDirectories(options.outputDir);

  const missingTools = await requireTools({ fullDownload: !options.dryRun });
  if (missingTools.length > 0) {
    throw new Error(`Missing required tools: ${missingTools.join(", ")}`);
  }

  const playlistMetadata = await getPlaylistMetadata({ playlistUrl: options.playlistUrl });

  if (options.dryRun) {
    await downloadPlaylistMetadata(options);
  } else {
    await downloadPlaylistMedia(options);
  }

  return writeManifest({
    playlistUrl: options.playlistUrl,
    outputDir: options.outputDir,
    generatedAt: new Date().toISOString(),
    requireVideoFiles: !options.dryRun,
    playlistMetadata,
  });
}

export function parseBatchArgs(argv = process.argv.slice(2)) {
  const parsed = {
    dryRun: false,
    outputRoot: "",
    only: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--output-root") {
      parsed.outputRoot = argv[++index] ?? "";
      continue;
    }

    if (arg === "--only") {
      parsed.only.push(argv[++index] ?? "");
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  parsed.only = parsed.only.filter(Boolean);
  return parsed;
}

export function resolveBatchOptions(parsed) {
  return {
    dryRun: Boolean(parsed.dryRun),
    outputRoot: path.resolve(parsed.outputRoot || DEFAULT_OUTPUT_ROOT),
    only: parsed.only ?? [],
  };
}

export function selectPlaylists(playlists, only) {
  if (!only.length) return playlists;

  const bySlug = new Map(playlists.map((playlist) => [playlist.slug, playlist]));
  return only.map((slug) => {
    const playlist = bySlug.get(slug);
    if (!playlist) {
      throw new Error(`Unknown playlist slug: ${slug}`);
    }
    return playlist;
  });
}

export async function preparePlaylistBatch({ playlists = SAMPLE_PLAYLISTS, options, prepareOne = prepareSampleCourse }) {
  const selectedPlaylists = selectPlaylists(playlists, options.only);
  const results = [];

  for (const playlist of selectedPlaylists) {
    const outputDir = path.join(options.outputRoot, playlist.slug);
    try {
      const manifest = await prepareOne({
        playlistUrl: playlist.url,
        outputDir,
        dryRun: options.dryRun,
      });
      const lessons = manifest.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
      const status = manifest.skipped ? "skipped" : "prepared";

      results.push({
        slug: playlist.slug,
        title: manifest.course.title,
        status,
        lessons,
      });

      const label = manifest.skipped ? "Skipped" : "Prepared";
      console.log(`${label} ${playlist.slug}: ${manifest.course.title} (${lessons} lessons)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        slug: playlist.slug,
        title: playlist.title,
        status: "failed",
        error: message,
      });
      console.error(`Failed ${playlist.slug}: ${message}`);
    }
  }

  return results;
}

function printHelp() {
  console.log(`Usage:
  npm run sample-courses:prepare -- [--dry-run] [--output-root sample-courses] [--only playlist-slug]

Options:
  --dry-run       Fetch metadata and write manifests without downloading videos.
  --output-root   Root directory for generated batch courses. Defaults to ./sample-courses.
  --only          Prepare only one catalog slug in batch mode. Can be repeated.
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  const parsed = parseBatchArgs(argv);
  if (parsed.help) {
    printHelp();
    return;
  }

  const options = resolveBatchOptions(parsed);
  const results = await preparePlaylistBatch({ options });
  if (results.some((result) => result.status === "failed")) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
