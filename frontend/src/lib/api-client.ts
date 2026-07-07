type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
	body?: unknown;
	params?: Record<string, QueryValue>;
}

type ApiErrorPayload = {
	message?: string;
	error?: string;
	code?: string;
};

export class ApiClientError extends Error {
	readonly statusCode: number;
	readonly code: string;

	constructor(message: string, statusCode: number, code: string) {
		super(message);
		this.name = "ApiClientError";
		this.statusCode = statusCode;
		this.code = code;
	}
}

const getBaseUrl = () => process.env.PUBLIC_API_URL || "http://localhost:5000";

const buildUrl = (path: string, params?: RequestOptions["params"]) => {
	const base = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;
	if (!params) return base;

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			searchParams.append(key, String(value));
		}
	}

	const serialized = searchParams.toString();
	if (!serialized) return base;
	return `${base}${base.includes("?") ? "&" : "?"}${serialized}`;
};

const buildHeaders = (headers: HeadersInit | undefined, hasBody: boolean) => {
	const result = new Headers(headers);
	if (hasBody && !result.has("Content-Type")) {
		result.set("Content-Type", "application/json");
	}
	return result;
};

const readErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		return (await response.json().catch(() => ({}))) as ApiErrorPayload;
	}

	const text = await response.text().catch(() => "");
	return text ? { message: text } : {};
};

const toApiClientError = async (response: Response) => {
	const payload = await readErrorPayload(response);
	return new ApiClientError(
		payload.message ||
			payload.error ||
			response.statusText ||
			`Request failed with status ${response.status}`,
		response.status,
		payload.code || "REQUEST_ERROR",
	);
};

const parseSuccessResponse = async <T>(response: Response): Promise<T> => {
	if (response.status === 204) {
		return undefined as T;
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		return (await response.json()) as T;
	}

	return (await response.text()) as T;
};

const request = async <T>(
	method: string,
	path: string,
	options: RequestOptions = {},
): Promise<T> => {
	const { body, params, headers, ...rest } = options;
	const hasBody = body !== undefined && body !== null;

	let response: Response;
	try {
		const requestInit: RequestInit = {
			...rest,
			method,
			headers: buildHeaders(headers, hasBody),
			credentials: rest.credentials ?? "include",
		};
		if (hasBody) {
			requestInit.body = JSON.stringify(body);
		}

		response = await fetch(buildUrl(path, params), requestInit);
	} catch (error) {
		throw new ApiClientError(
			error instanceof Error ? error.message : "Network error",
			0,
			"NETWORK_ERROR",
		);
	}

	if (!response.ok) {
		throw await toApiClientError(response);
	}

	return parseSuccessResponse<T>(response);
};

export const http = {
	get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("POST", path, { ...options, body }),
	put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PUT", path, { ...options, body }),
	patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PATCH", path, { ...options, body }),
	delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
