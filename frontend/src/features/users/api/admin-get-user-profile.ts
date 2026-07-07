import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetUserProfile(userId: string) {
	const api = await getServerApiClient();
	const response = await api.admin.users.getUserProfile({ params: { userId } });
	return response.body;
}
