import { QueryClient } from "@tanstack/react-query";
import {
	adminUsersQueryOptions,
	patchAdminUsersListProfile,
} from "@/features/users/hooks/use-admin-users-query";
import { queryKeys } from "@/lib/query-keys";

const users = [
	{
		id: "user-1",
		name: "Original Name",
		email: "an@example.com",
		image: null,
		role: "user",
		createdAt: "2026-01-01T00:00:00.000Z",
		profile: { phoneNumber: "123", phoneVerified: false },
	},
];

const savedProfile = {
	id: "user-1",
	name: "Saved Name",
	email: "an@example.com",
	image: "uploads/avatar.png",
	role: "admin",
	createdAt: "2026-01-01T00:00:00.000Z",
	profile: {
		dateOfBirth: null,
		gender: null,
		phoneNumber: "456",
		phoneVerified: true,
		country: null,
		province: null,
		district: null,
		ward: null,
		addressLine: null,
		bio: null,
		facebookUrl: null,
		linkedinUrl: null,
		githubUrl: null,
		websiteUrl: null,
		occupation: null,
		organization: null,
		education: null,
	},
};

describe("admin users query cache", () => {
	it("uses central query keys", () => {
		expect(adminUsersQueryOptions().queryKey).toEqual(queryKeys.admin.users.list());
	});

	it("patches an admin users list row from a saved profile", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.admin.users.list(), users);

		patchAdminUsersListProfile(queryClient, savedProfile);

		expect(queryClient.getQueryData(queryKeys.admin.users.list())).toEqual([
			{
				id: "user-1",
				name: "Saved Name",
				email: "an@example.com",
				image: "uploads/avatar.png",
				role: "admin",
				createdAt: "2026-01-01T00:00:00.000Z",
				profile: { phoneNumber: "456", phoneVerified: true },
			},
		]);
	});
});
