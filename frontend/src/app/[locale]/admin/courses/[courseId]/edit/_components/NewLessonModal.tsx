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
import { useCreateLessonMutation } from "@/features/courses/hooks/use-admin-course-structure-mutations";
import type { CreatedLesson } from "@/lib/api";
import { emptyToNull, type LessonSchemaType, lessonSchema } from "@/lib/zodSchemas";

export function NewLessonModal({
	courseId,
	chapterId,
	onCreated,
}: {
	courseId: string;
	chapterId: string;
	onCreated?: (lesson: CreatedLesson) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const createLesson = useCreateLessonMutation(courseId);
	const t = useTranslations("admin");
	const tErrors = useTranslations("errors");
	const form = useForm<LessonSchemaType>({
		resolver: zodResolver(lessonSchema) as Resolver<LessonSchemaType>,
		defaultValues: {
			nameEn: "",
			nameVi: "",
			courseId: courseId,
			chapterId: chapterId,
		},
	});

	async function onSubmit(values: LessonSchemaType) {
		const body = {
			...values,
			nameEn: emptyToNull(values.nameEn),
			nameVi: emptyToNull(values.nameVi),
		};
		createLesson.mutate(body, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
					onCreated?.(result.lesson);
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
		setIsOpen(open);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full justify-center gap-1">
					<Plus className="size-4" />
					{t("newLesson")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("newLesson")}</DialogTitle>
					<DialogDescription>{t("newLessonDescription")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<BilingualNameFields control={form.control} placeholder={t("lessonName")} />
						<DialogFooter>
							<Button disabled={createLesson.isPending} type="submit">
								{createLesson.isPending ? t("saving") : t("saveChange")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
