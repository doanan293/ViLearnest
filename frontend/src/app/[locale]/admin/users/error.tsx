"use client";

import { RouteErrorState } from "@/components/routes/RouteErrorState";

export default function RouteError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <RouteErrorState error={error} reset={reset} />;
}
