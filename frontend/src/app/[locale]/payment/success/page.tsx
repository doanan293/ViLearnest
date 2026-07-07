"use client";
import { ArrowLeft, CheckIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirmCheckoutMutation } from "@/features/courses/hooks/use-enrollment-mutations";
import { useConfetti } from "@/hooks/use-confetti";
import { Link } from "@/i18n/navigation";

export default function PaymentSuccessfull() {
	const { triggerConfetti } = useConfetti();
	const t = useTranslations("payment");
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const confirmCheckout = useConfirmCheckoutMutation();
	const confirmationStarted = useRef(false);

	useEffect(() => {
		triggerConfetti();
	}, [triggerConfetti]);

	useEffect(() => {
		if (!sessionId || confirmationStarted.current) {
			return;
		}

		confirmationStarted.current = true;
		confirmCheckout.mutate(sessionId);
	}, [confirmCheckout, sessionId]);

	function retryConfirmation() {
		if (!sessionId) return;
		confirmCheckout.mutate(sessionId);
	}

	const isConfirming = Boolean(sessionId) && confirmCheckout.isPending;
	const hasConfirmationError = Boolean(sessionId) && confirmCheckout.isError;

	return (
		<div className="w-full min-h-screen flex flex-1 justify-center items-center">
			<Card className="w-[350px]">
				<CardContent>
					<div className="w-full flex justify-center">
						<CheckIcon className="size-12 p-2 bg-green-500/30 text-green-500 rounded-full" />
					</div>
					<div className="mt-3 text-center sm:mt-5 w-full">
						<h2 className="text-xl font-semibold">{t("successTitle")}</h2>
						<p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
							{t("successDescription")}
						</p>
						{hasConfirmationError ? (
							<Button className="w-full mt-5" onClick={retryConfirmation}>
								{t("retry")}
							</Button>
						) : isConfirming ? (
							<Button className="w-full mt-5" disabled>
								{t("backToDashboard")}
							</Button>
						) : (
							<Link href="/dashboard" className={buttonVariants({ className: "w-full mt-5" })}>
								<ArrowLeft className="size-4" />
								{t("backToDashboard")}
							</Link>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
