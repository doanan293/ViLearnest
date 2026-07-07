export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function getLocaleFromPathname(pathname: string): Locale | undefined {
	const segment = pathname.split("/")[1];
	return locales.includes(segment as Locale) ? (segment as Locale) : undefined;
}

export function hasLocalePrefix(pathname: string): boolean {
	return getLocaleFromPathname(pathname) !== undefined;
}

export function stripLocaleFromPathname(pathname: string): string {
	const locale = getLocaleFromPathname(pathname);

	if (!locale) {
		return pathname || "/";
	}

	const withoutLocale = pathname.replace(`/${locale}`, "");
	return withoutLocale.length > 0 ? withoutLocale : "/";
}
