import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/features/auth/lib/auth-client";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ProfileSchemaType } from "@/lib/zodSchemas";
import type { ProfileResponse } from "../components/profile-types";
import { patchAdminUsersListProfile } from "./use-admin-users-query";

type UpdateProfileOptions = {
	mode: "me" | "admin";
	userId?: string;
	onSaved?: (profile: ProfileResponse) => void;
};

export function useUpdateProfileMutation({ mode, userId, onSaved }: UpdateProfileOptions) {
	const queryClient = useQueryClient();
	const session = authClient.useSession();

	return useMutation({
		mutationFn: async (values: ProfileSchemaType) => {
			if (mode === "admin") {
				if (!userId) throw new Error("Missing user ID");
				return api.adminUsers.updateProfile(userId, values);
			}
			return api.profile.updateMe(values);
		},
		onSuccess: (savedProfile) => {
			if (mode === "admin" && userId) {
				queryClient.setQueryData<ProfileResponse>(
					queryKeys.profile.adminUser(userId),
					savedProfile,
				);
				patchAdminUsersListProfile(queryClient, savedProfile);
			} else {
				queryClient.setQueryData<ProfileResponse>(queryKeys.profile.me(), savedProfile);
				void session.refetch({ query: { disableCookieCache: true } });
			}
			onSaved?.(savedProfile);
		},
	});
}
