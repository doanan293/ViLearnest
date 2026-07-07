import { AvailableCoursesSection, EnrolledCoursesSection } from "@/features/courses";

export default function DashboardPage() {
	return (
		<>
			<EnrolledCoursesSection />
			<AvailableCoursesSection />
		</>
	);
}
