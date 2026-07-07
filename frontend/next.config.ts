import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	env: {
		PUBLIC_API_URL: process.env.PUBLIC_API_URL || "http://localhost:5000",
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
