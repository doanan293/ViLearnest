import { getProfile } from "@/features/users/api/get-profile";
import { getServerApiClient } from "@/lib/server-api-client";

const redirectMock = jest.fn();

jest.mock("next/navigation", () => ({
	redirect: (...args: Array<unknown>) => redirectMock(...args),
}));

jest.mock("@/lib/server-api-client", () => ({
	getServerApiClient: jest.fn(),
}));

describe("getProfile", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("redirects to login when the profile API returns unauthorized", async () => {
		jest.mocked(getServerApiClient).mockResolvedValue({
			profile: {
				getMe: jest.fn(async () => ({
					status: 401,
					body: { status: "error", message: "Unauthorized" },
				})),
			},
		} as Awaited<ReturnType<typeof getServerApiClient>>);

		await getProfile();

		expect(redirectMock).toHaveBeenCalledWith("/login");
	});
});
