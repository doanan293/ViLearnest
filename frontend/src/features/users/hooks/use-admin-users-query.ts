import { type QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminUserSummary, ProfileResponse } from "../components/profile-types";

type QueryFn<T> = () => Promise<T>;

export function adminUsersQueryOptions(
	queryFn: QueryFn<Array<AdminUserSummary>> = () => api.adminUsers.getUsers(),
) {
	return queryOptions({
		queryKey: queryKeys.admin.users.list(),
		queryFn,
	});
}

export function useAdminUsersQuery() {
	return useQuery(adminUsersQueryOptions());
}

export function patchAdminUsersListProfile(queryClient: QueryClient, profile: ProfileResponse) {
	queryClient.setQueryData<Array<AdminUserSummary>>(queryKeys.admin.users.list(), (current) => {
		if (!current) return current;

		return current.map((user) => {
			if (user.id !== profile.id) return user;

			return {
				...user,
				name: profile.name,
				email: profile.email,
				image: profile.image,
				role: profile.role,
				profile: {
					phoneNumber: profile.profile?.phoneNumber ?? null,
					phoneVerified: profile.profile?.phoneVerified ?? false,
				},
			};
		});
	});
}
