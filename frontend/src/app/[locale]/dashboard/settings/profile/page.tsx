import { QueryClient } from "@tanstack/react-query";
import { getProfile, ProfileSettingsClient } from "@/features/users";
import { profileQueryOptions } from "@/features/users/hooks/use-profile-query";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";

export default async function ProfileSettingsPage() {
	const queryClient = await hydrateQueryClient(new QueryClient(), [
		profileQueryOptions(getProfile),
	]);

	return (
		<QueryHydrationBoundary queryClient={queryClient}>
			<ProfileSettingsClient />
		</QueryHydrationBoundary>
	);
}
