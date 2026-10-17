"use client";
import { SparkleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import slugify from "slugify";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/pathname";
import { type CourseSchemaType, slugSource } from "@/lib/zodSchemas";
import { LocaleTabs } from "./LocaleTabs";

const SUFFIX = { en: "En", vi: "Vi" } as const;

// Title, slug, short and long description for a course, edited one language at a time.
export function CourseTextFields({ form }: { form: UseFormReturn<CourseSchemaType> }) {
	const t = useTranslations("admin");
	const [locale, setLocale] = useState<Locale>("en");
	const suffix = SUFFIX[locale];
	const [titleEn, titleVi] = form.watch(["titleEn", "titleVi"]);

	return (
		<div className="space-y-6">
			<LocaleTabs
				value={locale}
				onChange={setLocale}
				hasContent={{ en: Boolean(titleEn?.trim()), vi: Boolean(titleVi?.trim()) }}
			/>
			<FormField
				key={`title${suffix}`}
				control={form.control}
				name={`title${suffix}`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("title")}</FormLabel>
						<FormControl>
							<Input placeholder={t("courseTitle")} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="flex gap-4 items-end">
				<FormField
					control={form.control}
					name="slug"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>{t("slug")}</FormLabel>
							<FormControl>
								<Input placeholder={t("slug")} {...field} />
							</FormControl>
						</FormItem>
					)}
				/>
				<Button
					type="button"
					className="w-fit"
					onClick={() => {
						const source = slugSource(form.getValues("titleEn"), form.getValues("titleVi"));
						form.setValue("slug", slugify(source), { shouldValidate: true });
					}}
				>
					{t("generateSlug")} <SparkleIcon className="ml-1" size={16} />
				</Button>
			</div>
			<FormField
				key={`smallDescription${suffix}`}
				control={form.control}
				name={`smallDescription${suffix}`}
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel>{t("smallDescription")}</FormLabel>
						<FormControl>
							<Textarea placeholder={t("smallDescription")} className="min-h-[120px]" {...field} />
						</FormControl>
					</FormItem>
				)}
			/>
			<FormField
				key={`description${suffix}`}
				control={form.control}
				name={`description${suffix}`}
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel>{t("description")}</FormLabel>
						<FormControl>
							<RichTextEditor field={field} />
						</FormControl>
					</FormItem>
				)}
			/>
		</div>
	);
}
