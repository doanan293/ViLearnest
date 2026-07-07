import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteErrorState } from "@/components/routes/RouteErrorState";

jest.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

describe("RouteErrorState", () => {
	it("renders a retry action that calls reset", async () => {
		const reset = jest.fn();

		render(<RouteErrorState error={new Error("Broken route")} reset={reset} />);

		expect(screen.getByText("routeErrorTitle")).toBeInTheDocument();
		expect(screen.getByText("Broken route")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "tryAgain" }));

		expect(reset).toHaveBeenCalledTimes(1);
	});
});
