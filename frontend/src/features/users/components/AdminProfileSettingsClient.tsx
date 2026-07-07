"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAdminProfileQuery } from "../hooks/use-profile-query";
import { ProfileForm } from "./ProfileForm";

type Props = {
	userId: string;
};

export function AdminProfileSettingsClient({ userId }: Props) {
	const queryClient = useQueryClient();
	const profileQuery = useAdminProfileQuery(userId);
	const profile = profileQuery.data;

	if (!profile) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Edit user profile</h1>
				<p className="text-muted-foreground text-sm">
					Editing {profile.name} ({profile.email})
				</p>
			</div>
			<ProfileForm
				profile={profile}
				mode="admin"
				userId={userId}
				onSaved={(savedProfile) => {
					queryClient.setQueryData(queryKeys.profile.adminUser(userId), savedProfile);
				}}
			/>
		</div>
	);
}
