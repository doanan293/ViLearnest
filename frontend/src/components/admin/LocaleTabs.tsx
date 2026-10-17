"use client";
import { useEffect } from "react";
import type { Locale } from "@/i18n/pathname";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "EN", vi: "VI" };

// Switches which language's inputs are visible; both languages stay in the form state.
export function LocaleTabs({
	value,
	onChange,
	hasContent,
}: {
	value: Locale;
	onChange: (locale: Locale) => void;
	hasContent: Record<Locale, boolean>;
}) {
	return (
		<div role="tablist" className="inline-flex rounded-md border p-0.5 text-xs font-medium">
			{(Object.keys(LABELS) as Array<Locale>).map((locale) => (
				<button
					key={locale}
					type="button"
					role="tab"
					aria-selected={value === locale}
					data-has-content={hasContent[locale]}
					onClick={() => onChange(locale)}
					className={cn(
						"flex items-center gap-1 rounded px-2.5 py-1 transition-colors",
						value === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground",
					)}
				>
					{LABELS[locale]}
					{hasContent[locale] && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
				</button>
			))}
		</div>
	);
}

// After a failed save, show the other tab when only it holds a validation error.
export function useShowErroredLocale(
	locale: Locale,
	setLocale: (locale: Locale) => void,
	hasError: Record<Locale, boolean>,
	submitCount: number,
) {
	const other: Locale = locale === "en" ? "vi" : "en";
	const switchTo = !hasError[locale] && hasError[other] ? other : null;
	// biome-ignore lint/correctness/useExhaustiveDependencies: only react to a new submit attempt
	useEffect(() => {
		if (switchTo) setLocale(switchTo);
	}, [submitCount]);
}
