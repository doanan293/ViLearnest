export type Locale = "en" | "vi";

type TextField = "title" | "smallDescription" | "description";

export type CourseTextColumns = {
  titleEn: string | null;
  titleVi: string | null;
  smallDescriptionEn: string | null;
  smallDescriptionVi: string | null;
  descriptionEn: string | null;
  descriptionVi: string | null;
};

export type ChapterTextColumns = {
  titleEn: string | null;
  titleVi: string | null;
};

export type LessonTextColumns = {
  titleEn: string | null;
  titleVi: string | null;
  descriptionEn: string | null;
  descriptionVi: string | null;
};

const SUFFIX: Record<Locale, "En" | "Vi"> = { en: "En", vi: "Vi" };
const OTHER: Record<Locale, Locale> = { en: "vi", vi: "en" };

export function parseLocale(value: unknown): Locale {
  return value === "vi" ? "vi" : "en";
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

// Requested language first, then the other one, so a page never shows an empty field.
export function pickText(row: Record<string, unknown>, field: TextField, locale: Locale): string | null {
  return nonEmpty(row[`${field}${SUFFIX[locale]}`]) ?? nonEmpty(row[`${field}${SUFFIX[OTHER[locale]]}`]);
}

export function localizeCourse<T extends CourseTextColumns>(
  row: T,
  locale: Locale
): Omit<T, keyof CourseTextColumns> & { title: string; smallDescription: string | null; description: string | null } {
  const {
    titleEn: _titleEn,
    titleVi: _titleVi,
    smallDescriptionEn: _smallEn,
    smallDescriptionVi: _smallVi,
    descriptionEn: _descriptionEn,
    descriptionVi: _descriptionVi,
    ...rest
  } = row;
  return {
    ...rest,
    title: pickText(row, "title", locale) ?? "",
    smallDescription: pickText(row, "smallDescription", locale),
    description: pickText(row, "description", locale),
  };
}

export function localizeChapter<T extends ChapterTextColumns>(
  row: T,
  locale: Locale
): Omit<T, keyof ChapterTextColumns> & { title: string } {
  const { titleEn: _titleEn, titleVi: _titleVi, ...rest } = row;
  return { ...rest, title: pickText(row, "title", locale) ?? "" };
}

export function localizeLesson<T extends LessonTextColumns>(
  row: T,
  locale: Locale
): Omit<T, keyof LessonTextColumns> & { title: string; description: string | null } {
  const {
    titleEn: _titleEn,
    titleVi: _titleVi,
    descriptionEn: _descriptionEn,
    descriptionVi: _descriptionVi,
    ...rest
  } = row;
  return {
    ...rest,
    title: pickText(row, "title", locale) ?? "",
    description: pickText(row, "description", locale),
  };
}
