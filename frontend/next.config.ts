import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	env: {
		PUBLIC_API_URL: process.env.PUBLIC_API_URL || "http://localhost:5000",
	},
	// In production the browser talks only to this origin: /api/* is forwarded to the backend,
	// so Better Auth's cookies are first-party. Locally the backend is reached directly.
	async rewrites() {
		const backendUrl = process.env.INTERNAL_API_URL;
		return backendUrl ? [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }] : [];
	},
	images: {
		remotePatterns: [{ hostname: "andv-lms.t3.storage.dev", port: "", protocol: "https" }],
	},
	webpack: (config) => {
		config.resolve.extensionAlias = {
			".js": [".ts", ".tsx", ".js"],
		};
		return config;
	},
	turbopack: {},
};

export default withNextIntl(nextConfig);
