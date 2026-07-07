import { z } from "zod";

export const HttpStatus = {
	OK: 200,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusType = (typeof HttpStatus)[keyof typeof HttpStatus];

export const ErrorResponseSchema = z.object({
	status: z.literal("error"),
	message: z.string(),
});

export const commonErrorResponses = {
	400: ErrorResponseSchema,
	401: ErrorResponseSchema,
	429: ErrorResponseSchema,
	500: ErrorResponseSchema,
} as const;
