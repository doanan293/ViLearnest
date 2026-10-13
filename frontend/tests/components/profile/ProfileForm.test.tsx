import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { ProfileForm } from "@/features/users/components/ProfileForm";
import type { ProfileResponse } from "@/features/users/components/profile-types";
import { api } from "@/lib/api";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh,
	}),
}));

jest.mock("sonner", () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}));

jest.mock("@/features/auth/lib/auth-client", () => ({
	authClient: {
		useSession: jest.fn(() => ({ refetch: jest.fn() })),
	},
}));

jest.mock("@/features/users/components/ProfileAvatarUploader", () => ({
	ProfileAvatarUploader: () => <div>Avatar uploader</div>,
}));

jest.mock("@/lib/api", () => ({
	api: {
		profile: {
			updateMe: jest.fn(),
		},
		adminUsers: {
			updateProfile: jest.fn(),
		},
	},
}));

const profile: ProfileResponse = {
	id: "user-1",
	name: "An Nguyen",
	email: "an@example.com",
	image: null,
	role: "user",
	createdAt: "2026-01-01T00:00:00.000Z",
	profile: {
		dateOfBirth: "1995-04-12T00:00:00.000Z",
		gender: "Male",
		phoneNumber: null,
		phoneVerified: false,
		country: null,
		province: null,
		district: null,
		ward: null,
		addressLine: null,
		bio: null,
		facebookUrl: null,
		linkedinUrl: null,
		githubUrl: null,
		websiteUrl: null,
		occupation: null,
		organization: null,
		education: null,
	},
};

function renderWithClient(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
	return queryClient;
}

describe("ProfileForm", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("uses shadcn controls for date of birth and gender", async () => {
		const user = userEvent.setup();

		renderWithClient(<ProfileForm profile={profile} mode="me" />);

		expect(screen.queryByDisplayValue("1995-04-12")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /date of birth/i })).toHaveTextContent(
			"April 12, 1995",
		);

		const gender = screen.getByRole("combobox", { name: /gender/i });
		expect(gender).toHaveTextContent("Male");

		await user.click(gender);

		expect(await screen.findByRole("option", { name: "Male" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Female" })).toBeInTheDocument();
		expect(screen.queryByRole("option", { name: /other/i })).not.toBeInTheDocument();
	});

	it("submits selected gender and date as profile schema values", async () => {
		const user = userEvent.setup();
		jest.mocked(api.profile.updateMe).mockResolvedValue(profile);

		renderWithClient(<ProfileForm profile={profile} mode="me" />);

		await user.click(screen.getByRole("button", { name: /date of birth/i }));
		await user.click(await screen.findByRole("button", { name: /April 15/i }));
		await user.click(screen.getByRole("combobox", { name: /gender/i }));
		await user.click(await screen.findByRole("option", { name: "Female" }));
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() =>
			expect(api.profile.updateMe).toHaveBeenCalledWith(
				expect.objectContaining({
					dateOfBirth: "1995-04-15",
					gender: "Female",
				}),
			),
		);
	});

	it("calls onSaved with the saved profile without refreshing the route", async () => {
		const user = userEvent.setup();
		const savedProfile = { ...profile, name: "An Saved" };
		const onSaved = jest.fn();
		jest.mocked(api.profile.updateMe).mockResolvedValue(savedProfile);

		renderWithClient(<ProfileForm profile={profile} mode="me" onSaved={onSaved} />);

		await user.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(onSaved).toHaveBeenCalledWith(savedProfile));
		expect(refresh).not.toHaveBeenCalled();
	});
});
