import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";
import type { ProfileResponse } from "../components/profile-types";

type QueryFn<T> = () => Promise<T>;

export function profileQueryOptions(queryFn: QueryFn<ProfileResponse> = () => api.profile.getMe()) {
	return queryOptions({
		queryKey: queryKeys.profile.me(),
		queryFn,
		staleTime: queryStaleTimes.profile,
	});
}

export function adminProfileQueryOptions(
	userId: string,
	queryFn: QueryFn<ProfileResponse> = () => api.adminUsers.getProfile(userId),
) {
	return queryOptions({
		queryKey: queryKeys.profile.adminUser(userId),
		queryFn,
		staleTime: queryStaleTimes.profile,
	});
}

export function useProfileQuery() {
	return useQuery(profileQueryOptions());
}

export function useAdminProfileQuery(userId: string) {
	return useQuery(adminProfileQueryOptions(userId));
}
