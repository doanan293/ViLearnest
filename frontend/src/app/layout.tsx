import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { defaultLocale, type Locale, locales } from "@/i18n/pathname";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AndvLMS - Learn anything you want",
	description:
		"AndvLMS is a modern learning management system (LMS) that makes it easy to create, manage, and sell online courses",
	icons: {
		icon: "/logo.svg",
	},
};

function getDocumentLocale(locale: string | null): Locale {
	return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const requestHeaders = await headers();
	const locale = getDocumentLocale(requestHeaders.get("X-NEXT-INTL-LOCALE"));

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster closeButton />
				</ThemeProvider>
				<SpeedInsights />
			</body>
		</html>
	);
}
