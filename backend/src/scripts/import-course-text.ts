// Manifest text is either { en, vi } or a plain string from older manifests, which counts as English.
export type ManifestText = string | { en?: string | null; vi?: string | null };

type TextPair = { en: string | null; vi: string | null };

function toPair(value: ManifestText | undefined): TextPair {
  if (typeof value === "string") {
    return { en: value || null, vi: null };
  }
  return { en: value?.en || null, vi: value?.vi || null };
}

const LESSON_PREFIX = { en: "Lesson", vi: "Bài" } as const;

function formatLessonTitle(originalTitle: string, globalPosition: number, locale: "en" | "vi"): string {
  let clean = originalTitle.trim();
  // Strip common redundant prefixes
  clean = clean.replace(/^OpenAI\s+Codex\s+Tutorial\s+#\d+\s*-\s*/i, "");
  // Capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `${LESSON_PREFIX[locale]} ${globalPosition}: ${clean}`;
}

export function courseTextValues(
  course: { title: ManifestText; smallDescription?: ManifestText },
  description: TextPair
) {
  const title = toPair(course.title);
  const smallDescription = toPair(course.smallDescription);
  return {
    titleEn: title.en,
    titleVi: title.vi,
    smallDescriptionEn: smallDescription.en,
    smallDescriptionVi: smallDescription.vi,
    descriptionEn: description.en,
    descriptionVi: description.vi,
  };
}

export function chapterTitleValues(title: ManifestText) {
  const pair = toPair(title);
  return { titleEn: pair.en, titleVi: pair.vi };
}

export function lessonTitleValues(title: ManifestText, globalPosition: number) {
  const pair = toPair(title);
  return {
    titleEn: pair.en && formatLessonTitle(pair.en, globalPosition, "en"),
    titleVi: pair.vi && formatLessonTitle(pair.vi, globalPosition, "vi"),
  };
}
