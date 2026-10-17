"use client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEnrollCourseMutation } from "@/features/courses/hooks/use-enrollment-mutations";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";

export function EnrollmentButton({ courseId }: { courseId: string }) {
	const enrollMutation = useEnrollCourseMutation();
	const router = useRouter();
	const tCommon = useTranslations("common");
	const tCourses = useTranslations("courses");
	const tErrors = useTranslations("errors");

	function onSubmit() {
		enrollMutation.mutate(courseId, {
			onSuccess: (result) => {
				if (result.status === "success") {
					if (result.checkoutUrl) {
						window.location.href = result.checkoutUrl;
					} else {
						toast.success(result.message);
					}
				} else if (result.status === "error") {
					toast.error(result.message);
				}
			},
			onError: (error) => {
				if (error instanceof ApiClientError && error.statusCode === 401) {
					router.push("/login");
					return;
				}
				toast.error(tErrors("unexpected"));
			},
		});
	}

	return (
		<Button onClick={onSubmit} disabled={enrollMutation.isPending} className="w-full">
			{enrollMutation.isPending ? (
				<>
					<Loader2 className="size-4 animate-spin" />
					{tCommon("loading")}
				</>
			) : (
				tCourses("enrollNow")
			)}
		</Button>
	);
}
