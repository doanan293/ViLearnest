import { render, screen } from "@testing-library/react";
import type React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

jest.mock("@radix-ui/react-avatar", () => ({
	Root: ({ children, ...props }: React.ComponentProps<"span">) => (
		<span {...props}>{children}</span>
	),
	Image: ({ alt, ...props }: React.ComponentProps<"img">) => (
		<span role="img" aria-label={alt} {...props} />
	),
	Fallback: ({ children, ...props }: React.ComponentProps<"span">) => (
		<span {...props}>{children}</span>
	),
}));

describe("AvatarImage", () => {
	it("uses object-cover so avatars do not stretch", () => {
		render(
			<Avatar>
				<AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" />
			</Avatar>,
		);

		expect(screen.getByRole("img", { name: "Avatar" })).toHaveClass("object-cover");
	});
});
