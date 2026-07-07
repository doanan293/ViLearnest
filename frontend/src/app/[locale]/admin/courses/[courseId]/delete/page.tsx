"use client";
import { Loader2, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteAdminCourseMutation } from "@/features/courses/hooks/use-admin-course-mutations";
import { Link, useRouter } from "@/i18n/navigation";

export default function DeleteCourseRoute() {
	const { courseId } = useParams<{ courseId: string }>();
	const deleteCourse = useDeleteAdminCourseMutation(courseId);
	const router = useRouter();
	const t = useTranslations("admin");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");

	function onSubmit() {
		deleteCourse.mutate(undefined, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
					router.push("/admin/courses");
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
		<div className="max-w-xl mx-auto w-full">
			<Card className="mt-32">
				<CardHeader>
					<CardTitle>
						<CardTitle>{t("deleteCourseTitle")}</CardTitle>
						<CardDescription>{t("deleteCannotUndo")}</CardDescription>
					</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-between">
					<Link className={buttonVariants({ variant: "outline" })} href="/admin/courses">
						{tCommon("cancel")}
					</Link>
					<Button variant="destructive" onClick={onSubmit} disabled={deleteCourse.isPending}>
						{deleteCourse.isPending ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								{t("deleting")}
							</>
						) : (
							<>
								<Trash2 className="size-4" />
								{t("delete")}
							</>
						)}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
