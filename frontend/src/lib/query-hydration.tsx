import {
	dehydrate,
	type FetchQueryOptions,
	HydrationBoundary,
	type QueryClient,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

type PrefetchableQuery = FetchQueryOptions<
	// TanStack Query's queryOptions preserves exact tuple keys. The helper accepts
	// a heterogeneous list, so these generics intentionally stay open.
	// biome-ignore lint/suspicious/noExplicitAny: heterogeneous query option list
	any,
	// biome-ignore lint/suspicious/noExplicitAny: heterogeneous query option list
	any,
	// biome-ignore lint/suspicious/noExplicitAny: heterogeneous query option list
	any,
	// biome-ignore lint/suspicious/noExplicitAny: heterogeneous query option list
	any
>;

export async function hydrateQueryClient(
	queryClient: QueryClient,
	queries: Array<PrefetchableQuery>,
) {
	await Promise.all(queries.map((query) => queryClient.prefetchQuery(query)));
	return queryClient;
}

export function QueryHydrationBoundary({
	children,
	queryClient,
}: {
	children: ReactNode;
	queryClient: QueryClient;
}) {
	return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
