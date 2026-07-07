import { QueryClient } from "@tanstack/react-query";
import { AdminProfileSettingsClient, adminGetUserProfile } from "@/features/users";
import { adminProfileQueryOptions } from "@/features/users/hooks/use-profile-query";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";

type Params = Promise<{
	userId: string;
}>;

export default async function AdminUserProfilePage({ params }: { params: Params }) {
	const { userId } = await params;
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		adminProfileQueryOptions(userId, () => adminGetUserProfile(userId)),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<AdminProfileSettingsClient userId={userId} />
		</QueryHydrationBoundary>
	);
}
