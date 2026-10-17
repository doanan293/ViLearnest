import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { BilingualNameFields } from "@/components/admin/BilingualNameFields";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useCreateChapterMutation } from "@/features/courses/hooks/use-admin-course-structure-mutations";
import type { CreatedChapter } from "@/lib/api";
import { type ChapterSchemaType, chapterSchema, emptyToNull } from "@/lib/zodSchemas";

export function NewChapterModal({
	courseId,
	onCreated,
}: {
	courseId: string;
	onCreated?: (chapter: CreatedChapter) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const createChapter = useCreateChapterMutation(courseId);
	const t = useTranslations("admin");
	const tErrors = useTranslations("errors");

	const form = useForm<ChapterSchemaType>({
		resolver: zodResolver(chapterSchema) as Resolver<ChapterSchemaType>,
		defaultValues: {
			nameEn: "",
			nameVi: "",
			courseId: courseId,
		},
	});

	async function onSubmit(values: ChapterSchemaType) {
		const body = {
			...values,
			nameEn: emptyToNull(values.nameEn),
			nameVi: emptyToNull(values.nameVi),
		};
		createChapter.mutate(body, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
					onCreated?.(result.chapter);
					form.reset();
					setIsOpen(false);
				} else if (result.status === "error") {
					toast.error(result.message);
				}
			},
			onError: () => {
				toast.error(tErrors("unexpected"));
			},
		});
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			form.reset();
		}
		setIsOpen(open);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Plus className="size-4" />
					{t("newChapter")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("newChapter")}</DialogTitle>
					<DialogDescription>{t("newChapterDescription")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<BilingualNameFields control={form.control} placeholder={t("chapterName")} />
						<DialogFooter>
							<Button disabled={createChapter.isPending} type="submit">
								{createChapter.isPending ? t("saving") : t("saveChapter")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
