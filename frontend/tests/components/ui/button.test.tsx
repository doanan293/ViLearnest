import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
	it("does not submit a parent form by default", () => {
		const onSubmit = jest.fn((event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
		});

		render(
			<form onSubmit={onSubmit}>
				<Button>Open tools</Button>
			</form>,
		);

		const button = screen.getByRole("button", { name: "Open tools" });

		expect(button).toHaveAttribute("type", "button");

		fireEvent.click(button);

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("preserves explicit submit buttons", () => {
		render(<Button type="submit">Save</Button>);

		expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
	});
});
