import { fireEvent, render, screen } from "@testing-library/react";
import { useStableScrollOnToggle } from "@/hooks/use-stable-scroll-on-toggle";

function TestToggle() {
	const preserveScrollPosition = useStableScrollOnToggle();

	return (
		<button type="button" onClick={(event) => preserveScrollPosition(event.currentTarget)}>
			Toggle section
		</button>
	);
}

function createRect(top: number): DOMRect {
	return {
		x: 0,
		y: top,
		top,
		left: 0,
		right: 100,
		bottom: top + 40,
		width: 100,
		height: 40,
		toJSON: () => ({}),
	};
}

describe("useStableScrollOnToggle", () => {
	const originalRequestAnimationFrame = window.requestAnimationFrame;
	const originalCancelAnimationFrame = window.cancelAnimationFrame;
	const originalScrollBy = window.scrollBy;

	afterEach(() => {
		window.requestAnimationFrame = originalRequestAnimationFrame;
		window.cancelAnimationFrame = originalCancelAnimationFrame;
		window.scrollBy = originalScrollBy;
		jest.restoreAllMocks();
	});

	it("preserves the clicked element's viewport position after the next layout frame", () => {
		let animationFrame: FrameRequestCallback | undefined;
		let top = 320;
		const scrollBy = jest.fn();

		window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
			animationFrame = callback;
			return 1;
		});
		window.cancelAnimationFrame = jest.fn();
		window.scrollBy = scrollBy;

		render(<TestToggle />);

		const button = screen.getByRole("button", { name: "Toggle section" });
		jest.spyOn(button, "getBoundingClientRect").mockImplementation(() => createRect(top));

		fireEvent.click(button);
		top = 180;
		animationFrame?.(performance.now());

		expect(scrollBy).toHaveBeenCalledWith({ top: -140, left: 0, behavior: "auto" });
	});
});
