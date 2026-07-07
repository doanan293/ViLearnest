import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./pathname";

export const routing = defineRouting({
	locales,
	defaultLocale,
	localeDetection: true,
	localePrefix: "always",
});
