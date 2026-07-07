"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "../lib/auth-client";

export function useSignOut() {
	const router = useRouter();
	const tToasts = useTranslations("toasts");
	const tErrors = useTranslations("errors");

	const handleSignout = async function signOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/");
					toast.success(tToasts("signedOut"));
				},
				onError: () => {
					toast.error(tErrors("signOutFailed"));
				},
			},
		});
	};
	return handleSignout;
}
