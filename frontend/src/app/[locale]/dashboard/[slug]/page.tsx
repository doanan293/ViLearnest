import { getTranslations } from "next-intl/server";
import { getCourseSidebarData } from "@/features/courses";
import { redirect } from "@/i18n/navigation";

interface iAppProps {
	params: Promise<{ locale: string; slug: string }>;
}
export default async function CourseSlugRoute({ params }: iAppProps) {
	const { locale, slug } = await params;
	const t = await getTranslations("dashboard");
	const course = await getCourseSidebarData(slug);
	const firstChapter = course.course.chapter[0];
	const firstLesson = firstChapter.lessons[0];

	if (firstLesson) {
		redirect({ href: `/dashboard/${slug}/${firstLesson.id}`, locale });
	}
	return (
		<div className="flex items-center justify-center h-full text-center">
			<h2 className="text-2xl font-bold mb-2">{t("noLessonsTitle")}</h2>
			<p className="text-muted-foreground">{t("noLessonsDescription")}</p>
		</div>
	);
}
