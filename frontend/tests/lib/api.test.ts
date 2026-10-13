import { api } from "@/lib/api";
import { ApiClientError, http } from "@/lib/api-client";

const originalPublicApiUrl = process.env.PUBLIC_API_URL;

type MockResponse = {
	ok?: boolean;
	status?: number;
	statusText?: string;
	headers?: HeadersInit;
	body?: unknown;
};

function mockFetch(response: MockResponse) {
	const fetchMock = jest.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
		const headers = new Headers(response.headers);
		return {
			ok: response.ok ?? true,
			status: response.status ?? 200,
			statusText: response.statusText ?? "OK",
			headers,
			json: async () => response.body,
			text: async () =>
				typeof response.body === "string" ? response.body : JSON.stringify(response.body ?? ""),
		} as Response;
	}) as jest.MockedFunction<typeof fetch>;

	Object.defineProperty(global, "fetch", {
		configurable: true,
		value: fetchMock,
	});

	return fetchMock;
}

describe("http client", () => {
	afterEach(() => {
		process.env.PUBLIC_API_URL = originalPublicApiUrl;
		jest.restoreAllMocks();
	});

	it("does not send a JSON content type for requests without a body", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		const fetchMock = mockFetch({
			body: { status: "success", message: "Course deleted successfully" },
			headers: { "Content-Type": "application/json" },
		});

		await api.admin.deleteCourse("course-1");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://api.test/api/v1/admin/courses/course-1",
			expect.objectContaining({
				method: "DELETE",
				credentials: "include",
			}),
		);
		const requestInit = fetchMock.mock.calls[0]?.[1];
		expect(new Headers(requestInit?.headers).has("Content-Type")).toBe(false);
		expect(requestInit).not.toHaveProperty("body");
	});

	it("sends JSON content type and body for requests with a body", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		const fetchMock = mockFetch({
			body: { exists: true },
			headers: { "Content-Type": "application/json" },
		});

		await api.auth.emailExists("student@example.com");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://api.test/api/v1/auth/email-exists",
			expect.objectContaining({
				method: "POST",
				credentials: "include",
				body: JSON.stringify({ email: "student@example.com" }),
			}),
		);
		const requestInit = fetchMock.mock.calls[0]?.[1];
		expect(new Headers(requestInit?.headers).get("Content-Type")).toBe("application/json");
	});

	it("serializes defined query params and skips nullish query params", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		const fetchMock = mockFetch({ body: "ok", headers: { "Content-Type": "text/plain" } });

		await http.get<string>("/api/v1/search", {
			params: {
				q: "course",
				page: 2,
				published: true,
				empty: null,
				missing: undefined,
			},
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://api.test/api/v1/search?q=course&page=2&published=true",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("returns undefined for 204 responses", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		mockFetch({ status: 204, statusText: "No Content", body: undefined });

		await expect(http.delete<void>("/api/v1/storage/files/file-1")).resolves.toBeUndefined();
	});

	it("returns text for non-JSON success responses", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		mockFetch({ body: "plain response", headers: { "Content-Type": "text/plain" } });

		await expect(http.get<string>("/api/v1/plain")).resolves.toBe("plain response");
	});

	it("throws ApiClientError for JSON error responses", async () => {
		process.env.PUBLIC_API_URL = "http://api.test";
		mockFetch({
			ok: false,
			status: 400,
			statusText: "Bad Request",
			body: { message: "Invalid request", code: "BAD_REQUEST" },
			headers: { "Content-Type": "application/json" },
		});

		await expect(http.get("/api/v1/fail")).rejects.toMatchObject({
			message: "Invalid request",
			statusCode: 400,
			code: "BAD_REQUEST",
		});
		await expect(http.get("/api/v1/fail")).rejects.toBeInstanceOf(ApiClientError);
	});
});
