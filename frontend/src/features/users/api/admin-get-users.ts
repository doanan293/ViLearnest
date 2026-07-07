import { getServerApiClient } from "@/lib/server-api-client";

export async function adminGetUsers() {
	const api = await getServerApiClient();
	const response = await api.admin.users.getUsers();
	return response.body;
}
