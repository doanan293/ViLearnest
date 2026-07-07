import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { LoginForm } from "@/app/[locale]/(auth)/login/_components/LoginForm";
import { authClient } from "@/features/auth";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockReplace = jest.fn();

jest.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
	useLocale: () => "vi",
}));

jest.mock("next/navigation", () => ({
	useSearchParams: jest.fn(),
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
	useRouter: () => ({ push: mockPush, refresh: mockRefresh, replace: mockReplace }),
}));

jest.mock("@/features/auth", () => ({
	authClient: {
		useSession: jest.fn(() => ({ data: null, isPending: false })),
		signIn: {
			social: jest.fn(),
			email: jest.fn(),
		},
	},
	getAuthCallbackURL: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
	api: {
		auth: {
			emailExists: jest.fn(),
		},
	},
}));

const mockUseSearchParams = useSearchParams as jest.Mock;

function renderLoginForm() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});

	render(
		<QueryClientProvider client={queryClient}>
			<Suspense>
				<LoginForm />
			</Suspense>
		</QueryClientProvider>,
	);
}

describe("LoginForm", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("defaults to signin tab when no query parameter is provided", () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams());

		renderLoginForm();

		const signInTrigger = screen.getByRole("tab", { name: "signIn" });
		const signUpTrigger = screen.getByRole("tab", { name: "signUp" });

		expect(signInTrigger).toHaveAttribute("data-state", "active");
		expect(signUpTrigger).toHaveAttribute("data-state", "inactive");
	});

	it("defaults to signup tab when tab=signup query parameter is provided", () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams("tab=signup"));

		renderLoginForm();

		const signInTrigger = screen.getByRole("tab", { name: "signIn" });
		const signUpTrigger = screen.getByRole("tab", { name: "signUp" });

		expect(signInTrigger).toHaveAttribute("data-state", "inactive");
		expect(signUpTrigger).toHaveAttribute("data-state", "active");
	});

	it("updates URL with router.replace when tab switches", async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams());
		const user = userEvent.setup();

		renderLoginForm();

		const signUpTrigger = screen.getByRole("tab", { name: "signUp" });
		await user.click(signUpTrigger);

		expect(mockReplace).toHaveBeenCalledWith("/login?tab=signup");

		const signInTrigger = screen.getByRole("tab", { name: "signIn" });
		await user.click(signInTrigger);

		expect(mockReplace).toHaveBeenCalledWith("/login");
	});

	it("replaces the route after successful email sign in without refreshing", async () => {
		mockUseSearchParams.mockReturnValue(new URLSearchParams());
		jest.mocked(authClient.signIn.email).mockResolvedValue({ error: null } as never);
		const user = userEvent.setup();

		renderLoginForm();

		await user.type(screen.getByLabelText("email"), "an@example.com");
		await user.type(screen.getByLabelText("password"), "password123");
		await user.click(screen.getByRole("button", { name: "signIn" }));

		await waitFor(() => expect(authClient.signIn.email).toHaveBeenCalled());
		expect(mockReplace).toHaveBeenCalledWith("/");
		expect(mockPush).not.toHaveBeenCalledWith("/");
		expect(mockRefresh).not.toHaveBeenCalled();
	});
});
