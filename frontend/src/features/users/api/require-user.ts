import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerApiClient } from "@/lib/server-api-client";

export const requireUser = cache(async () => {
	const api = await getServerApiClient();
	const response = await api.auth.getSession();

	if (response.status !== 200) {
		return redirect("/login");
	}

	return response.body.user;
});
