import { QueryClient } from "@tanstack/react-query";
import { adminGetUsers } from "@/features/users";
import { AdminUsersClientSection } from "@/features/users/components/AdminUsersClientSection";
import { adminUsersQueryOptions } from "@/features/users/hooks/use-admin-users-query";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";

export default async function AdminUsersPage() {
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		adminUsersQueryOptions(adminGetUsers),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Users</h1>
				<p className="text-muted-foreground text-sm">View and edit user profile details.</p>
			</div>
			<QueryHydrationBoundary queryClient={queryClient}>
				<AdminUsersClientSection />
			</QueryHydrationBoundary>
		</div>
	);
}
