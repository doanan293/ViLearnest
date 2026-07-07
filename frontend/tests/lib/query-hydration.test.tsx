import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { hydrateQueryClient, QueryHydrationBoundary } from "@/lib/query-hydration";

function HydratedValue() {
	const { data, isLoading } = useQuery({
		queryKey: ["hydrated", "value"],
		queryFn: async () => "client value",
	});

	if (isLoading) return <p>Loading only</p>;
	return <p>{data}</p>;
}

describe("query hydration helpers", () => {
	it("hydrates prefetched data before the client component renders", async () => {
		const queryClient = new QueryClient();
		await hydrateQueryClient(queryClient, [
			{
				queryKey: ["hydrated", "value"],
				queryFn: async () => "server value",
			},
		]);

		render(
			<QueryClientProvider client={queryClient}>
				<QueryHydrationBoundary queryClient={queryClient}>
					<HydratedValue />
				</QueryHydrationBoundary>
			</QueryClientProvider>,
		);

		expect(screen.queryByText("Loading only")).not.toBeInTheDocument();
		expect(screen.getByText("server value")).toBeInTheDocument();
	});
});
