import type { Locale } from "@/i18n/pathname";

export function getAuthCallbackURL(origin: string, locale: Locale) {
	const normalizedOrigin = origin.replace(/\/+$/, "");
	return `${normalizedOrigin}/${locale}`;
}
