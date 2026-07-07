import { getServerApiClient } from "@/lib/server-api-client";

jest.mock("next/headers", () => ({
	headers: jest.fn(async () => new Headers()),
}));

const originalInternalApiUrl = process.env.INTERNAL_API_URL;
const originalPublicApiUrl = process.env.PUBLIC_API_URL;

describe("getServerApiClient", () => {
	afterEach(() => {
		process.env.INTERNAL_API_URL = originalInternalApiUrl;
		process.env.PUBLIC_API_URL = originalPublicApiUrl;
		jest.restoreAllMocks();
	});

	it("uses PUBLIC_API_URL as the backend origin when INTERNAL_API_URL is not configured", async () => {
		delete process.env.INTERNAL_API_URL;
		process.env.PUBLIC_API_URL = "http://localhost:5000";
		const fetchMock = jest.fn(async () => ({
			status: 200,
			text: async () => "[]",
		}));
		Object.defineProperty(global, "fetch", {
			configurable: true,
			value: fetchMock,
		});

		const client = await getServerApiClient();
		await client.courses.getAllCourses();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:5000/api/v1/courses",
			expect.objectContaining({ cache: "no-store" }),
		);
	});

	it("calls profile and admin user endpoints", async () => {
		process.env.INTERNAL_API_URL = "http://internal-api";
		const fetchMock = jest.fn(async () => ({
			status: 200,
			text: async () => "{}",
		}));
		Object.defineProperty(global, "fetch", {
			configurable: true,
			value: fetchMock,
		});

		const client = await getServerApiClient();
		await client.profile.getMe();
		await client.admin.users.getUsers();
		await client.admin.users.getUserProfile({ params: { userId: "user-1" } });

		expect(fetchMock).toHaveBeenCalledWith(
			"http://internal-api/api/v1/profile/me",
			expect.objectContaining({ cache: "no-store" }),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://internal-api/api/v1/admin/users",
			expect.objectContaining({ cache: "no-store" }),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://internal-api/api/v1/admin/users/user-1/profile",
			expect.objectContaining({ cache: "no-store" }),
		);
	});

	it("does not send a JSON content type for server GET requests without a body", async () => {
		process.env.INTERNAL_API_URL = "http://internal-api";
		const fetchMock = jest.fn(async () => ({
			status: 200,
			text: async () => "[]",
		}));
		Object.defineProperty(global, "fetch", {
			configurable: true,
			value: fetchMock,
		});

		const client = await getServerApiClient();
		await client.courses.getAllCourses();

		const requestInit = fetchMock.mock.calls[0]?.[1];
		expect(new Headers(requestInit?.headers).has("Content-Type")).toBe(false);
	});
});
