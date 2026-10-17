import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { EnrollmentButton } from "@/app/[locale]/(public)/courses/[slug]/_components/EnrollmentButton";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

jest.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string) => key,
}));

jest.mock("@/i18n/navigation", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("sonner", () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}));

jest.mock("@/lib/api", () => ({
	api: {
		courses: {
			enroll: jest.fn(),
		},
	},
}));

function renderWithClient() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
	render(
		<QueryClientProvider client={queryClient}>
			<EnrollmentButton courseId="course-1" />
		</QueryClientProvider>,
	);
	return { invalidateSpy, queryClient };
}

describe("EnrollmentButton", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("enrolls and invalidates enrollment/dashboard queries", async () => {
		jest.mocked(api.courses.enroll).mockResolvedValue({
			status: "success",
			message: "Enrolled",
		});
		const user = userEvent.setup();
		const { invalidateSpy, queryClient } = renderWithClient();

		await user.click(screen.getByRole("button", { name: "enrollNow" }));

		await waitFor(() => expect(api.courses.enroll).toHaveBeenCalledWith("course-1", "en"));
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.courses.enrollmentStatus("course-1"),
		});
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.dashboard.enrolledCourses(),
		});
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.dashboard.availableCourses(),
		});
		expect(queryClient.getQueryData(queryKeys.courses.enrollmentStatus("course-1"))).toBe(true);
		expect(toast.success).toHaveBeenCalledWith("Enrolled");
	});
});
