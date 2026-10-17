import crypto from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { eq } from "drizzle-orm";
import { config } from "../config/index.js";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { chapterTitleValues, courseTextValues, lessonTitleValues, type ManifestText } from "./import-course-text.js";

const ADMIN_EMAIL = "andoan020903@gmail.com";

interface ManifestLesson {
  title: ManifestText;
  position: number;
  videoFile: string;
  thumbnailFile?: string;
  descriptionMarkdownPath: string;
}

interface ManifestChapter {
  title: ManifestText;
  position: number;
  lessons: ManifestLesson[];
}

interface PreparedLesson {
  id: string;
  titleEn: string | null;
  titleVi: string | null;
  // YouTube descriptions are English.
  descriptionEn: string | null;
  thumbnailKey: string | null;
  videoKey: string;
  position: number;
  chapterId: string;
}

interface PreparedChapter {
  id: string;
  titleEn: string | null;
  titleVi: string | null;
  position: number;
  courseId: string;
  lessons: PreparedLesson[];
}

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(CURRENT_DIR, "../..");
const SAMPLE_COURSES_DIR = path.join(ROOT_DIR, "sample-courses");

const CHAPTERS_MAPPING: Record<string, { title: { en: string; vi: string }; startPosition: number }[]> = {
  "openai-codex-tutorial": [
    { title: { en: "Chapter 1: Introduction & Setup", vi: "Chương 1: Giới thiệu & Cài đặt" }, startPosition: 1 },
    {
      title: { en: "Chapter 2: Codex CLI & Configuration Files", vi: "Chương 2: Codex CLI & Sử dụng file cấu hình" },
      startPosition: 3,
    },
    {
      title: {
        en: "Chapter 3: Advanced Features & Work Environments",
        vi: "Chương 3: Tính năng nâng cao & Môi trường làm việc",
      },
      startPosition: 7,
    },
  ],
  "vibe-coding-ai-studio": [
    {
      title: {
        en: "Chapter 1: Vibe Coding Concepts & First Look",
        vi: "Chương 1: Khái niệm & Trải nghiệm Vibe Coding",
      },
      startPosition: 1,
    },
    {
      title: { en: "Chapter 2: Hands-on Practice & Real-world Apps", vi: "Chương 2: Thực hành & Ứng dụng thực tế" },
      startPosition: 5,
    },
  ],
  "ai-in-100-seconds": [
    {
      title: { en: "Chapter 1: Neural Network & AI Basics", vi: "Chương 1: Khái niệm cơ bản về Neural Network & AI" },
      startPosition: 1,
    },
    { title: { en: "Chapter 2: Python Basics", vi: "Chương 2: Lập trình Python cơ bản" }, startPosition: 6 },
    {
      title: {
        en: "Chapter 3: Quantum Computing & Advanced Technology",
        vi: "Chương 3: Tính toán lượng tử & Công nghệ nâng cao",
      },
      startPosition: 8,
    },
  ],
  "github-copilot-cli": [
    {
      title: { en: "Chapter 1: Getting Started with Copilot CLI", vi: "Chương 1: Làm quen với Copilot CLI" },
      startPosition: 1,
    },
    {
      title: { en: "Chapter 2: Advanced Usage & MCP Servers", vi: "Chương 2: Sử dụng nâng cao & MCP Servers" },
      startPosition: 4,
    },
  ],
  "ai-fast": [
    {
      title: { en: "Chapter 1: Claude Code Basics & How It Works", vi: "Chương 1: Claude Code cơ bản & Hoạt động" },
      startPosition: 1,
    },
    {
      title: { en: "Chapter 2: Supporting Git & DevOps Knowledge", vi: "Chương 2: Kiến thức Git & DevOps bổ trợ" },
      startPosition: 6,
    },
    {
      title: { en: "Chapter 3: Advanced Agents & Applications", vi: "Chương 3: Agent nâng cao & Ứng dụng" },
      startPosition: 10,
    },
  ],
};

const COURSE_METADATA_MAPPING: Record<
  string,
  { category: string; level: "Beginner" | "Intermediate" | "Advanced"; price: number }
> = {
  "openai-codex-tutorial": {
    category: "IT & Software",
    level: "Intermediate",
    price: 49,
  },
  "vibe-coding-ai-studio": {
    category: "Development",
    level: "Beginner",
    price: 29,
  },
  "ai-in-100-seconds": {
    category: "IT & Software",
    level: "Beginner",
    price: 19,
  },
  "github-copilot-cli": {
    category: "Development",
    level: "Beginner",
    price: 19,
  },
  "ai-fast": {
    category: "Development",
    level: "Intermediate",
    price: 39,
  },
};

const s3 = new S3Client({
  region: config.awsRegion,
  endpoint: config.awsEndpointUrlS3,
  forcePathStyle: false,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 15000,
    socketTimeout: 45000,
  }),
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uploadToS3(localFilePath: string, s3Key: string) {
  const buffer = await readFile(localFilePath);
  const contentType = getMimeType(localFilePath);

  // Check if file already exists in S3 with same size
  try {
    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: config.s3BucketName,
        Key: s3Key,
      })
    );
    if (head.ContentLength === buffer.length) {
      console.log(`[S3] Skipped (already uploaded): ${s3Key}`);
      return;
    }
  } catch (_e) {
    // Object doesn't exist, proceed with upload
  }

  console.log(`[S3] Uploading ${localFilePath} -> ${s3Key} (${contentType})`);
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3BucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

async function uploadToS3WithRetry(localFilePath: string, s3Key: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await uploadToS3(localFilePath, s3Key);
      return;
    } catch (error) {
      console.warn(`[S3] Upload failed (attempt ${attempt}/${retries}) for key ${s3Key}: ${error}`);
      if (attempt === retries) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
}

function markdownToTipTapJson(markdownText: string): string {
  const blocks = markdownText.split(/\n\s*\n/);
  const contentNode: Record<string, unknown>[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      contentNode.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: trimmed.slice(4).trim() }],
      });
    } else if (trimmed.startsWith("## ")) {
      contentNode.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: trimmed.slice(3).trim() }],
      });
    } else if (trimmed.startsWith("# ")) {
      contentNode.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: trimmed.slice(2).trim() }],
      });
    } else {
      const lines = trimmed.split("\n");
      for (const line of lines) {
        let lineText = line.trim();
        if (!lineText) continue;

        if (lineText.startsWith("- ") || lineText.startsWith("* ")) {
          lineText = `• ${lineText.slice(2)}`;
        }

        contentNode.push({
          type: "paragraph",
          content: [{ type: "text", text: lineText }],
        });
      }
    }
  }

  if (contentNode.length === 0) {
    contentNode.push({
      type: "paragraph",
      content: [{ type: "text", text: "" }],
    });
  }

  return JSON.stringify({
    type: "doc",
    content: contentNode,
  });
}

async function cleanDescription(markdownPath: string): Promise<string | null> {
  if (!(await fileExists(markdownPath))) {
    return null;
  }
  const content = await readFile(markdownPath, "utf8");
  // Strip the first markdown heading if present
  const cleaned = content.replace(/^#\s+.+$/m, "").trim();
  return markdownToTipTapJson(cleaned);
}

async function importCourse(courseSlug: string, adminUserId: string) {
  const courseDir = path.join(SAMPLE_COURSES_DIR, courseSlug);
  const manifestPath = path.join(courseDir, "manifest.json");
  if (!(await fileExists(manifestPath))) {
    console.warn(`[Warning] No manifest.json found in ${courseDir}. Skipping.`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Importing course: ${courseSlug}`);
  console.log(`========================================`);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const { course: manifestCourse, chapters } = manifest;

  // --- 1. S3 UPLOAD PHASE (outside DB transaction) ---

  // Find Course Cover
  const videosDir = path.join(courseDir, "videos");
  let coverLocalFile = "";
  if (await fileExists(videosDir)) {
    const videoFiles = await readdir(videosDir);
    const coverFile = videoFiles.find(
      (file) => file.startsWith("000-") && (file.endsWith(".jpg") || file.endsWith(".png") || file.endsWith(".jpeg"))
    );
    if (coverFile) {
      coverLocalFile = path.join(videosDir, coverFile);
    }
  }

  let s3CoverKey = `courses/${manifestCourse.slug}/cover.jpg`;
  if (coverLocalFile) {
    await uploadToS3WithRetry(coverLocalFile, s3CoverKey);
  } else {
    console.warn(`[Warning] Cover image starting with '000-' not found for ${courseSlug}. Using fallback.`);
    s3CoverKey = "fallback-cover.jpg";
  }

  // Pre-generate IDs and S3 keys for insertion later
  const courseId = crypto.randomUUID();
  const courseDescPath = path.join(courseDir, manifestCourse.descriptionMarkdownPath || "course.md");
  const courseDescription = {
    en: await cleanDescription(courseDescPath),
    vi: manifestCourse.descriptionMarkdownPathVi
      ? await cleanDescription(path.join(courseDir, manifestCourse.descriptionMarkdownPathVi))
      : null,
  };

  // Extract all lessons from manifest chapters
  const allLessons = (chapters as ManifestChapter[]).flatMap((ch) => ch.lessons || []);

  // Get chapters configuration for this course
  const configChapters = CHAPTERS_MAPPING[courseSlug] || [
    { title: { en: "Course content", vi: "Nội dung khóa học" }, startPosition: 1 },
  ];

  // Sort configChapters by startPosition ascending
  const sortedConfigChapters = [...configChapters].sort((a, b) => a.startPosition - b.startPosition);

  const preparedChapters: PreparedChapter[] = [];

  for (let i = 0; i < sortedConfigChapters.length; i++) {
    const configChapter = sortedConfigChapters[i];
    const nextChapter = sortedConfigChapters[i + 1];

    const chapterId = crypto.randomUUID();
    const preparedLessons: PreparedLesson[] = [];

    // Filter lessons belonging to this chapter
    const chapterLessons = allLessons.filter((lesson: ManifestLesson) => {
      const pos = Number(lesson.position);
      if (nextChapter) {
        return pos >= configChapter.startPosition && pos < nextChapter.startPosition;
      }
      return pos >= configChapter.startPosition;
    });

    let localPos = 1;
    for (const manifestLesson of chapterLessons) {
      const lessonId = crypto.randomUUID();
      const globalPos = Number(manifestLesson.position);

      // S3 upload video
      const videoLocalPath = path.join(courseDir, manifestLesson.videoFile);
      const videoKey = `courses/${manifestCourse.slug}/videos/${globalPos}-${path.basename(manifestLesson.videoFile)}`;
      await uploadToS3WithRetry(videoLocalPath, videoKey);

      // S3 upload lesson thumbnail
      let thumbnailKey = "";
      if (manifestLesson.thumbnailFile) {
        const thumbLocalPath = path.join(courseDir, manifestLesson.thumbnailFile);
        thumbnailKey = `courses/${manifestCourse.slug}/thumbnails/${globalPos}-${path.basename(manifestLesson.thumbnailFile)}`;
        await uploadToS3WithRetry(thumbLocalPath, thumbnailKey);
      }

      const lessonDescPath = path.join(courseDir, manifestLesson.descriptionMarkdownPath);
      const lessonDesc = await cleanDescription(lessonDescPath);

      preparedLessons.push({
        id: lessonId,
        ...lessonTitleValues(manifestLesson.title, globalPos),
        descriptionEn: lessonDesc,
        thumbnailKey: thumbnailKey || null,
        videoKey: videoKey,
        position: localPos++, // Scoped per-chapter
        chapterId: chapterId,
      });
    }

    preparedChapters.push({
      id: chapterId,
      ...chapterTitleValues(configChapter.title),
      position: i + 1, // Chapter index starts at 1
      courseId: courseId,
      lessons: preparedLessons,
    });
  }

  // --- 2. DB WRITE PHASE (short-lived transaction) ---

  // Check and delete existing course to ensure idempotency
  const existing = await db.query.course.findFirst({
    where: eq(schema.course.slug, manifestCourse.slug),
  });
  if (existing) {
    console.log(`[DB] Deleting existing course: ${manifestCourse.slug}`);
    await db.delete(schema.course).where(eq(schema.course.slug, manifestCourse.slug));
  }

  // Resolve specific metadata configurations
  const meta = COURSE_METADATA_MAPPING[courseSlug] || {
    category: manifestCourse.category || "Web Development",
    level: (manifestCourse.level || "Beginner") as "Beginner" | "Intermediate" | "Advanced",
    price: Number(manifestCourse.price) || 0,
  };

  console.log(`[DB] Starting transaction to insert course: ${manifestCourse.slug}`);
  await db.transaction(async (tx) => {
    await tx.insert(schema.course).values({
      id: courseId,
      ...courseTextValues(manifestCourse, courseDescription),
      fileKey: s3CoverKey,
      price: meta.price,
      duration: Number(manifestCourse.duration) || 0,
      level: meta.level,
      stripePriceId: `mock-price-${manifestCourse.slug}`,
      category: meta.category,
      slug: manifestCourse.slug,
      status: "Published",
      userId: adminUserId,
    });

    for (const preparedChapter of preparedChapters) {
      console.log(`[DB] Inserting Chapter: ${preparedChapter.titleEn ?? preparedChapter.titleVi}`);
      await tx.insert(schema.chapter).values({
        id: preparedChapter.id,
        titleEn: preparedChapter.titleEn,
        titleVi: preparedChapter.titleVi,
        position: preparedChapter.position,
        courseId: preparedChapter.courseId,
      });

      for (const preparedLesson of preparedChapter.lessons) {
        console.log(`[DB] Inserting Lesson: ${preparedLesson.titleEn ?? preparedLesson.titleVi}`);
        await tx.insert(schema.lesson).values({
          id: preparedLesson.id,
          titleEn: preparedLesson.titleEn,
          titleVi: preparedLesson.titleVi,
          descriptionEn: preparedLesson.descriptionEn,
          thumbnailKey: preparedLesson.thumbnailKey,
          videoKey: preparedLesson.videoKey,
          position: preparedLesson.position,
          chapterId: preparedLesson.chapterId,
        });
      }
    }
  });

  console.log(`[Success] Finished importing course: ${manifestCourse.slug}`);
}

async function main() {
  console.log(`Looking up admin user: ${ADMIN_EMAIL}`);
  const adminUser = await db.query.user.findFirst({
    where: eq(schema.user.email, ADMIN_EMAIL),
  });

  if (!adminUser) {
    throw new Error(
      `Admin user with email ${ADMIN_EMAIL} was not found in the database. Please ensure they are registered first.`
    );
  }

  const directories = await readdir(SAMPLE_COURSES_DIR, { withFileTypes: true });
  const courseSlugs = directories.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);

  console.log(`Found ${courseSlugs.length} course(s) to import.`);
  for (const slug of courseSlugs) {
    try {
      await importCourse(slug, adminUser.id);
    } catch (err) {
      console.error(`[Error] Failed to import course ${slug}:`, err);
    }
  }

  console.log("\nAll course import operations finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during import:", err);
  process.exit(1);
});
