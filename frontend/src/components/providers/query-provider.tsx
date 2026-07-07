"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { HttpStatus } from "@/lib/constants/http";
import { queryStaleTimes } from "@/lib/query-stale-times";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const tErrors = useTranslations("errors");
	const tToasts = useTranslations("toasts");
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: queryStaleTimes.default,
						refetchOnWindowFocus: false,
					},
				},
				mutationCache: new MutationCache({
					onError: (error) => {
						const apiError = error as { status?: number; message?: string };
						if (apiError.status === HttpStatus.UNAUTHORIZED) {
							toast.error(tToasts("sessionExpired"));
							window.location.href = "/login";
						} else if (apiError.status === HttpStatus.TOO_MANY_REQUESTS) {
							toast.error(tErrors("rateLimited"));
						} else {
							toast.error(apiError.message || tErrors("unexpected"));
						}
					},
				}),
			}),
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
