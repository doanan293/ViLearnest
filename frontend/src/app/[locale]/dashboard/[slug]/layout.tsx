import { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CourseSidebar, getCourseSidebarData } from "@/features/courses";
import { courseSidebarQueryOptions } from "@/features/courses/hooks/use-course-player-query";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";

interface iAppProps {
	params: Promise<{ slug: string }>;
	children: ReactNode;
}

export default async function CourseLayout({ children, params }: iAppProps) {
	const { slug } = await params;

	//server-side security check and lightweight data fetching
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		courseSidebarQueryOptions(slug, () => getCourseSidebarData(slug)),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<div className="flex flex-1">
				{/* sidebar - 30% */}
				<div className="w-80 border-r border-border shrink-0">
					<CourseSidebar slug={slug} />
				</div>
				{/* main content - 70% */}
				<div className="flex-1 overflow-hidden">{children}</div>
			</div>
		</QueryHydrationBoundary>
	);
}
