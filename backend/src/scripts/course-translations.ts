const COURSE_COLUMNS = [
  "titleEn",
  "titleVi",
  "smallDescriptionEn",
  "smallDescriptionVi",
  "descriptionEn",
  "descriptionVi",
] as const;
const TITLE_COLUMNS = ["titleEn", "titleVi"] as const;

type CourseColumn = (typeof COURSE_COLUMNS)[number];
type TitleColumn = (typeof TITLE_COLUMNS)[number];
type Titles = Record<TitleColumn, string | null>;

// Chapters are keyed by position, lessons by "<chapterPosition>.<lessonPosition>".
export type TranslationData = Record<
  string,
  {
    course: Partial<Record<CourseColumn, string>>;
    chapters: Record<string, Partial<Record<TitleColumn, string>>>;
    lessons: Record<string, Partial<Record<TitleColumn, string>>>;
  }
>;

export type CourseSnapshot = {
  id: string;
  text: Record<CourseColumn, string | null>;
  chapters: Array<Titles & { id: string; position: number }>;
  lessons: Array<Titles & { id: string; chapterPosition: number; position: number }>;
};

export type Change = {
  table: "Course" | "Chapter" | "Lesson";
  id: string;
  column: CourseColumn;
  from: string | null;
  to: string;
};

export interface TranslationDb {
  loadCourse(slug: string): Promise<CourseSnapshot | null>;
  // Must write all changes in one transaction.
  applyChanges(changes: Change[]): Promise<void>;
}

function diff(
  table: Change["table"],
  id: string,
  current: Partial<Record<CourseColumn, string | null>>,
  wanted: Partial<Record<CourseColumn, string>>,
  columns: readonly CourseColumn[],
  overwrite: boolean
): Change[] {
  const changes: Change[] = [];
  for (const column of columns) {
    const to = wanted[column];
    const from = current[column] ?? null;
    // Without overwrite, text already in the database (for example an admin's edit) is kept.
    if (!to || to === from || (from && !overwrite)) continue;
    changes.push({ table, id, column, from, to });
  }
  return changes;
}

export async function planTranslations(
  db: TranslationDb,
  data: TranslationData,
  { overwrite }: { overwrite: boolean }
): Promise<Change[]> {
  const changes: Change[] = [];

  for (const [slug, entry] of Object.entries(data)) {
    const course = await db.loadCourse(slug);
    if (!course) throw new Error(`Unknown course slug: ${slug}`);

    changes.push(...diff("Course", course.id, course.text, entry.course, COURSE_COLUMNS, overwrite));

    for (const [position, titles] of Object.entries(entry.chapters)) {
      const chapter = course.chapters.find((row) => String(row.position) === position);
      if (!chapter) throw new Error(`Unknown ${slug} chapter ${position}`);
      changes.push(...diff("Chapter", chapter.id, chapter, titles, TITLE_COLUMNS, overwrite));
    }

    for (const [key, titles] of Object.entries(entry.lessons)) {
      const lesson = course.lessons.find((row) => `${row.chapterPosition}.${row.position}` === key);
      if (!lesson) throw new Error(`Unknown ${slug} lesson ${key}`);
      changes.push(...diff("Lesson", lesson.id, lesson, titles, TITLE_COLUMNS, overwrite));
    }
  }

  return changes;
}

export async function applyTranslations(db: TranslationDb, changes: Change[]): Promise<void> {
  if (changes.length > 0) {
    await db.applyChanges(changes);
  }
}
