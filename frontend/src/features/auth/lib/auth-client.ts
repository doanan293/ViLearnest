import { adminClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.PUBLIC_API_URL || "http://localhost:5000",
	plugins: [emailOTPClient(), adminClient()],
});
