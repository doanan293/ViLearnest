import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentCta } from "@/app/[locale]/(public)/courses/[slug]/_components/EnrollmentCta";
import { api } from "@/lib/api";

jest.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({
		children,
		className,
		href,
	}: {
		children: React.ReactNode;
		className?: string;
		href: string;
	}) => (
		<a className={className} href={href}>
			{children}
		</a>
	),
}));

jest.mock("@/lib/api", () => ({
	api: {
		courses: {
			enroll: jest.fn(),
			isEnrolled: jest.fn(),
		},
	},
}));

function renderWithClient() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	render(
		<QueryClientProvider client={queryClient}>
			<EnrollmentCta courseId="course-1" />
		</QueryClientProvider>,
	);

	return queryClient;
}

describe("EnrollmentCta", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders the dashboard link when the user is enrolled", async () => {
		jest.mocked(api.courses.isEnrolled).mockResolvedValue({ enrolled: true });

		renderWithClient();

		const link = await screen.findByRole("link", { name: "watchCourse" });
		expect(link).toHaveAttribute("href", "/dashboard");
	});

	it("renders the enrollment button when the user is not enrolled", async () => {
		jest.mocked(api.courses.isEnrolled).mockResolvedValue({ enrolled: false });

		renderWithClient();

		expect(await screen.findByRole("button", { name: "enrollNow" })).toBeInTheDocument();
	});

	it("allows retrying when enrollment status fails", async () => {
		jest
			.mocked(api.courses.isEnrolled)
			.mockRejectedValueOnce(new Error("network"))
			.mockResolvedValueOnce({ enrolled: true });
		const user = userEvent.setup();

		renderWithClient();

		const retry = await screen.findByRole("button", { name: "enrollNow" });
		await user.click(retry);

		await waitFor(() => expect(api.courses.isEnrolled).toHaveBeenCalledTimes(2));
		expect(await screen.findByRole("link", { name: "watchCourse" })).toBeInTheDocument();
	});
});
