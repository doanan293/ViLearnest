import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteLessonMutation } from "@/features/courses/hooks/use-admin-course-structure-mutations";

export function DeleteLesson({
	chapterId,
	courseId,
	lessonId,
	onDeleted,
}: {
	chapterId: string;
	courseId: string;
	lessonId: string;
	onDeleted?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const deleteLesson = useDeleteLessonMutation(courseId, chapterId);
	const t = useTranslations("admin");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");

	async function onSubmit() {
		deleteLesson.mutate(lessonId, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
					setOpen(false);
					onDeleted?.();
				} else if (result.status === "error") {
					toast.error(result.message);
				}
			},
			onError: () => {
				toast.error(tErrors("unexpected"));
			},
		});
	}
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="ghost">
					<Trash2 className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
					<AlertDialogDescription>{t("deleteLessonDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
					<Button onClick={onSubmit} disabled={deleteLesson.isPending}>
						{deleteLesson.isPending ? t("deleting") : t("delete")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
