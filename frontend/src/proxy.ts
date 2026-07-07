import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getLocaleFromPathname, stripLocaleFromPathname } from "@/i18n/pathname";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

const intlMiddleware = createIntlMiddleware(routing);

const aj = arcjet({
	key: env.ARCJET_KEY,
	rules: [
		detectBot({
			mode: env.ARCJET_MODE,
			// Block all bots except the following
			allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW", "STRIPE_WEBHOOK"],
		}),
	],
});

async function authProxy(request: NextRequest) {
	const cookie = request.headers.get("cookie") || "";
	const authHeader = request.headers.get("authorization") || "";
	const locale = getLocaleFromPathname(request.nextUrl.pathname) ?? routing.defaultLocale;

	try {
		const apiUrl = process.env.PUBLIC_API_URL || "http://localhost:5000";
		const response = await fetch(`${apiUrl}/api/auth/session`, {
			headers: {
				cookie,
				authorization: authHeader,
				"user-agent": request.headers.get("user-agent") || "",
			},
		});

		if (!response.ok) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}

		const session = await response.json();
		if (!session) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	} catch (error) {
		console.error("Auth proxy error:", error);
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	return null;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)"],
};
export default createMiddleware(aj, async (request: NextRequest) => {
	const pathname = request.nextUrl.pathname;

	if (!getLocaleFromPathname(pathname)) {
		return intlMiddleware(request);
	}

	if (stripLocaleFromPathname(pathname).startsWith("/admin")) {
		const authResponse = await authProxy(request);
		if (authResponse) {
			return authResponse;
		}
	}

	return intlMiddleware(request);
});
