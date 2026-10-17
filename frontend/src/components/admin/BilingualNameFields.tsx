"use client";
import { useTranslations } from "next-intl";
import type { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Chapter and lesson names: one short input per language, side by side.
export function BilingualNameFields<T extends FieldValues & { nameEn: string; nameVi: string }>({
	control,
	placeholder,
}: {
	control: Control<T>;
	placeholder: string;
}) {
	const t = useTranslations("admin");

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{(["nameEn", "nameVi"] as const).map((name) => (
				<FormField
					key={name}
					control={control}
					name={name as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("name")} ({name === "nameEn" ? "EN" : "VI"})
							</FormLabel>
							<FormControl>
								<Input placeholder={placeholder} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			))}
		</div>
	);
}
