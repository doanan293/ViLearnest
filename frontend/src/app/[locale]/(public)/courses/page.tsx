import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/features/courses";
import { PublicCourseCard } from "../_components/PublicCourseCard";

export const dynamic = "force-dynamic";

export default async function PublicCoursesRoute() {
	const t = await getTranslations("courses");

	return (
		<div className="mt-5">
			<div className="flex flex-col space-y-2 mb-10">
				<h1 className="text-3xl md:text-4xl font-bold tracking-tighter">{t("exploreTitle")}</h1>
				<p className="text-muted-foreground">{t("exploreDescription")}</p>
			</div>
			<RenderCourses />
		</div>
	);
}

async function RenderCourses() {
	const courses = await getAllCourses();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{courses.map((course) => (
				<PublicCourseCard key={course.id} data={course} />
			))}
		</div>
	);
}
