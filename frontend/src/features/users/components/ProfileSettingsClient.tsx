"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { useProfileQuery } from "../hooks/use-profile-query";
import { ProfileForm } from "./ProfileForm";
import { SettingsSidebar } from "./SettingsSidebar";

export function ProfileSettingsClient() {
	const session = authClient.useSession();
	const queryClient = useQueryClient();
	const profileQuery = useProfileQuery();

	return (
		<div className="flex flex-col gap-6 md:flex-row">
			<SettingsSidebar />
			<main className="min-w-0 flex-1 space-y-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
					<p className="text-muted-foreground text-sm">Manage your personal information.</p>
				</div>
				{profileQuery.error ? (
					<ProfileError
						message={
							profileQuery.error instanceof Error
								? profileQuery.error.message
								: "Profile load failed"
						}
					/>
				) : profileQuery.data ? (
					<ProfileForm
						profile={profileQuery.data}
						mode="me"
						onSaved={(savedProfile) => {
							queryClient.setQueryData(queryKeys.profile.me(), savedProfile);
							void session.refetch({ query: { disableCookieCache: true } });
						}}
					/>
				) : (
					<ProfileSkeleton />
				)}
			</main>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-20 w-20 rounded-lg" />
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
			<Skeleton className="h-28 w-full" />
		</div>
	);
}

function ProfileError({ message }: { message: string }) {
	return (
		<div className="space-y-4 rounded-md border p-6">
			<div>
				<h2 className="font-semibold">Could not load profile</h2>
				<p className="text-muted-foreground text-sm">{message}</p>
			</div>
			<Button type="button" onClick={() => window.location.assign("/login")}>
				Sign in
			</Button>
		</div>
	);
}
