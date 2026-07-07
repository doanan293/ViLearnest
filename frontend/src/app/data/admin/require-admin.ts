import "server-only";
import { redirect } from "next/navigation";
import { getServerApiClient } from "@/lib/server-api-client";

export async function requireAdmin() {
	const api = await getServerApiClient();
	const response = await api.auth.getSession();

	if (response.status !== 200) {
		return redirect("/login");
	}

	const { user, session } = response.body;

	if (user.role !== "admin") {
		return redirect("/not-admin");
	}

	return { user, session };
}
