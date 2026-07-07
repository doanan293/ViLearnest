import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { authClient } from "@/features/auth";
import { ProfileSettingsClient } from "@/features/users/components/ProfileSettingsClient";
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
			<span>{profile.email}</span>
			<span>{profile.image}</span>
			<button
				type="button"
				onClick={() => onSaved?.({ ...profile, image: "uploads/new-avatar.png" })}
			>
				Save avatar
			</button>
		</div>
	),
}));

jest.mock("@/features/users/components/SettingsSidebar", () => ({
	SettingsSidebar: () => <nav>Settings navigation</nav>,
}));

jest.mock("@/lib/api", () => ({
	api: {
		profile: {
			getMe: jest.fn(),
		},
	},
}));

jest.mock("@/features/auth", () => ({
	authClient: {
		useSession: jest.fn(),
	},
}));

function renderWithClient(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
	return queryClient;
}

describe("ProfileSettingsClient", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("loads the profile from the browser API client", async () => {
		jest.mocked(authClient.useSession).mockReturnValue({ refetch: jest.fn() } as never);
		jest.mocked(api.profile.getMe).mockResolvedValue({
			id: "user-1",
			name: "An Nguyen",
			email: "an@example.com",
			image: null,
			role: "user",
			createdAt: "2026-01-01T00:00:00.000Z",
			profile: null,
		});

		renderWithClient(<ProfileSettingsClient />);

		await waitFor(() => expect(api.profile.getMe).toHaveBeenCalledTimes(1));
		expect(await screen.findByText("an@example.com")).toBeInTheDocument();
	});

	it("updates the loaded profile and refreshes the auth session after saving", async () => {
		const refetch = jest.fn();
		jest.mocked(authClient.useSession).mockReturnValue({ refetch } as never);
		jest.mocked(api.profile.getMe).mockResolvedValue({
			id: "user-1",
			name: "An Nguyen",
			email: "an@example.com",
			image: null,
			role: "user",
			createdAt: "2026-01-01T00:00:00.000Z",
			profile: null,
		});

		renderWithClient(<ProfileSettingsClient />);

		fireEvent.click(await screen.findByRole("button", { name: "Save avatar" }));

		expect(await screen.findByText("uploads/new-avatar.png")).toBeInTheDocument();
		expect(refetch).toHaveBeenCalledWith({ query: { disableCookieCache: true } });
	});
});
