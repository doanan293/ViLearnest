"use client";

import { Languages } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, locales } from "@/i18n/pathname";

const localeLabels: Record<Locale, "english" | "vietnamese"> = {
	en: "english",
	vi: "vietnamese",
};

export function LanguageSwitcher() {
	const currentLocale = useLocale() as Locale;
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const t = useTranslations("common");

	function switchLocale(locale: Locale) {
		const query = Object.fromEntries(searchParams.entries());
		router.replace({ pathname, query }, { locale });
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
					<Languages className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((locale) => (
					<DropdownMenuItem
						key={locale}
						disabled={locale === currentLocale}
						onClick={() => switchLocale(locale)}
					>
						<span className="w-7 font-medium uppercase">{locale}</span>
						<span>{t(localeLabels[locale])}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
