import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleTabs } from "@/components/admin/LocaleTabs";

describe("LocaleTabs", () => {
	it("switches to Vietnamese when the VI tab is clicked", async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(<LocaleTabs value="en" onChange={onChange} hasContent={{ en: true, vi: false }} />);
		await user.click(screen.getByRole("tab", { name: /VI/ }));

		expect(onChange).toHaveBeenCalledWith("vi");
	});

	it("marks the tabs that already have content", () => {
		render(<LocaleTabs value="en" onChange={jest.fn()} hasContent={{ en: true, vi: false }} />);

		expect(screen.getByRole("tab", { name: /EN/ })).toHaveAttribute("data-has-content", "true");
		expect(screen.getByRole("tab", { name: /VI/ })).toHaveAttribute("data-has-content", "false");
	});
});
