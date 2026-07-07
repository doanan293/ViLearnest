"use client";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
	useVerifyEmailOtpMutation,
	useVerifySignInOtpMutation,
} from "@/features/auth/hooks/use-auth-command-mutations";
import { useRouter } from "@/i18n/navigation";

export default function VerifyRequestRoute() {
	return (
		<Suspense>
			<VerifyRequest />
		</Suspense>
	);
}

function VerifyRequest() {
	const router = useRouter();
	const t = useTranslations("auth.verifyRequest");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");
	const tToasts = useTranslations("toasts");
	const [otp, setOtp] = useState("");
	const verifyEmailOtp = useVerifyEmailOtpMutation();
	const verifySignInOtp = useVerifySignInOtpMutation();
	const emailPending = verifyEmailOtp.isPending || verifySignInOtp.isPending;
	const params = useSearchParams();
	const email = params.get("email") as string;
	const type = params.get("type");
	const isOtpCompleted = otp.length === 6;

	function verifyOtp() {
		if (type === "signup") {
			verifyEmailOtp.mutate(
				{ email, otp },
				{
					onSuccess: () => {
						toast.success(tToasts("emailVerifiedSignIn"));
						router.push("/login");
					},
					onError: (error) => {
						toast.error(error.message || tErrors("verifyEmailFailed"));
					},
				},
			);
			return;
		}

		verifySignInOtp.mutate(
			{ email, otp },
			{
				onSuccess: () => {
					toast.success(tToasts("emailVerified"));
					router.push("/");
				},
				onError: (error) => {
					toast.error(error.message || tErrors("verifyOtpFailed"));
				},
			},
		);
	}
	return (
		<Card className="w-full mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-xl">{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex flex-col items-center space-y-2">
					<InputOTP value={otp} onChange={(value) => setOtp(value)} maxLength={6} className="gap-2">
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
					<p className="text-sm text-muted-foreground">{t("hint")}</p>
				</div>

				<Button onClick={verifyOtp} disabled={emailPending || !isOtpCompleted} className="w-full">
					{emailPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							<span>{tCommon("loading")}</span>
						</>
					) : (
						t("submit")
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
