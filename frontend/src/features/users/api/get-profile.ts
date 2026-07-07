import { redirect } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function getProfile() {
	const api = await getServerApiClient();
	const response = await api.profile.getMe();

	if (response.status !== 200) {
		return redirect("/login");
	}

	return response.body;
}
