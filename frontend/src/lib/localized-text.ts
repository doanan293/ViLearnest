import type { Locale } from "@/i18n/pathname";

type Field = "title" | "smallDescription" | "description";
const SUFFIX = { en: "En", vi: "Vi" } as const;

// Admin screens hold both languages; show the admin's language and fall back to the other one.
export function pickLocalized(
	row: Partial<Record<`${Field}${"En" | "Vi"}`, string | null>>,
	field: Field,
	locale: Locale,
): string | null {
	const other: Locale = locale === "en" ? "vi" : "en";
	return row[`${field}${SUFFIX[locale]}`] || row[`${field}${SUFFIX[other]}`] || null;
}
