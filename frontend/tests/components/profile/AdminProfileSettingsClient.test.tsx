import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminProfileSettingsClient } from "@/features/users/components/AdminProfileSettingsClient";
import type { ProfileResponse } from "@/features/users/components/profile-types";
import { api } from "@/lib/api";

jest.mock("@/features/users/components/ProfileForm", () => ({
	ProfileForm: ({
		profile,
		onSaved,
	}: {
		profile: ProfileResponse;
		onSaved?: (profile: ProfileResponse) => void;
	}) => (
		<div>
			<span>{profile.name}</span>
			<button type="button" onClick={() => onSaved?.({ ...profile, name: "Saved Name" })}>
				Save admin profile
			</button>
		</div>
	),
}));

jest.mock("@/lib/api", () => ({
	api: {
		adminUsers: {
			getProfile: jest.fn(),
		},
	},
}));

const initialProfile: ProfileResponse = {
	id: "user-1",
	name: "Original Name",
	email: "an@example.com",
	image: null,
	role: "user",
	createdAt: "2026-01-01T00:00:00.000Z",
	profile: null,
};

function renderWithClient() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	queryClient.setQueryData(["profile", "adminUser", "user-1"], initialProfile);
	jest.mocked(api.adminUsers.getProfile).mockResolvedValue(initialProfile);

	render(
		<QueryClientProvider client={queryClient}>
			<AdminProfileSettingsClient userId="user-1" />
		</QueryClientProvider>,
	);
}

describe("AdminProfileSettingsClient", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("updates the heading from the saved profile response", async () => {
		renderWithClient();

		expect(screen.getByText("Editing Original Name (an@example.com)")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Save admin profile" }));

		await waitFor(() =>
			expect(screen.getByText("Editing Saved Name (an@example.com)")).toBeInTheDocument(),
		);
	});
});
