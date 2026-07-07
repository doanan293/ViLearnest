"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type RouteErrorStateProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export function RouteErrorState({ error, reset }: RouteErrorStateProps) {
	const t = useTranslations("errors");
	const message = error.message || t("unexpected");

	return (
		<div className="mx-auto flex min-h-[320px] max-w-xl flex-col items-center justify-center px-6 text-center">
			<div className="mb-4 flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
				<AlertTriangle className="size-6" />
			</div>
			<h1 className="text-xl font-semibold tracking-normal">{t("routeErrorTitle")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">{message}</p>
			<Button className="mt-6" onClick={reset}>
				<RotateCcw className="size-4" />
				{t("tryAgain")}
			</Button>
		</div>
	);
}
