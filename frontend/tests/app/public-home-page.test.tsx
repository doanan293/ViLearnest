import { render, screen } from "@testing-library/react";
import type React from "react";
import Home from "@/app/[locale]/(public)/page";

jest.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));

jest.mock("@/i18n/navigation", () => ({
	Link: ({
		children,
		className,
		href,
	}: {
		children: React.ReactNode;
		className?: string;
		href: string;
	}) => (
		<a className={className} href={href}>
			{children}
		</a>
	),
}));

describe("public home page", () => {
	it("keeps the hero focused on exploring courses without a duplicate sign-in action", async () => {
		render(await Home());

		expect(screen.getByRole("link", { name: "exploreCourses" })).toHaveAttribute(
			"href",
			"/courses",
		);
		expect(screen.queryByRole("link", { name: "signIn" })).not.toBeInTheDocument();
	});
});
