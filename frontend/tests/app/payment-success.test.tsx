import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";
import type React from "react";
import PaymentSuccessfull from "@/app/[locale]/payment/success/page";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
	useSearchParams: jest.fn(),
}));

jest.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string) => key,
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({
		children,
		href,
		className,
	}: {
		children: React.ReactNode;
		href: string;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
	useRouter: () => ({ refresh }),
}));

jest.mock("@/hooks/use-confetti", () => ({
	useConfetti: () => ({ triggerConfetti: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
	api: {
		courses: {
			confirmCheckout: jest.fn(),
		},
	},
}));

const mockUseSearchParams = useSearchParams as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
	render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
	return { invalidateSpy };
}

describe("PaymentSuccessfull", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("confirms checkout and invalidates dashboard enrollment data without refreshing", async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams("session_id=cs_123"));
		jest
			.mocked(api.courses.confirmCheckout)
			.mockResolvedValue({ status: "success", message: "ok" });

		const { invalidateSpy } = renderWithClient(<PaymentSuccessfull />);

		await waitFor(() => expect(api.courses.confirmCheckout).toHaveBeenCalledWith("cs_123"));
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.dashboard.enrolledCourses(),
		});
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.dashboard.availableCourses(),
		});
		expect(refresh).not.toHaveBeenCalled();
		expect(await screen.findByRole("link", { name: /backToDashboard/i })).toHaveAttribute(
			"href",
			"/dashboard",
		);
	});

	it("shows retry when confirmation fails", async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams("session_id=cs_123"));
		jest.mocked(api.courses.confirmCheckout).mockRejectedValueOnce(new Error("network"));
		jest
			.mocked(api.courses.confirmCheckout)
			.mockResolvedValueOnce({ status: "success", message: "ok" });
		const user = userEvent.setup();

		renderWithClient(<PaymentSuccessfull />);

		const retry = await screen.findByRole("button", { name: /retry/i });
		await user.click(retry);

		await waitFor(() => expect(api.courses.confirmCheckout).toHaveBeenCalledTimes(2));
		expect(refresh).not.toHaveBeenCalled();
	});
});
