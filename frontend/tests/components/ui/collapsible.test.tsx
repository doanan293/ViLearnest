import { fireEvent, render, screen } from "@testing-library/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function TestCollapsible() {
	return (
		<Collapsible>
			<CollapsibleTrigger>Toggle chapter</CollapsibleTrigger>
			<CollapsibleContent>Chapter lessons</CollapsibleContent>
		</Collapsible>
	);
}

function createRect(top: number): DOMRect {
	return {
		x: 0,
		y: top,
		top,
		left: 0,
		right: 160,
		bottom: top + 40,
		width: 160,
		height: 40,
		toJSON: () => ({}),
	};
}

describe("CollapsibleTrigger", () => {
	const originalRequestAnimationFrame = window.requestAnimationFrame;
	const originalCancelAnimationFrame = window.cancelAnimationFrame;
	const originalScrollBy = window.scrollBy;

	afterEach(() => {
		window.requestAnimationFrame = originalRequestAnimationFrame;
		window.cancelAnimationFrame = originalCancelAnimationFrame;
		window.scrollBy = originalScrollBy;
		jest.restoreAllMocks();
	});

	it("preserves the trigger viewport position after a toggle layout shift", () => {
		let animationFrame: FrameRequestCallback | undefined;
		let top = 280;
		const scrollBy = jest.fn();

		window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
			animationFrame = callback;
			return 1;
		});
		window.cancelAnimationFrame = jest.fn();
		window.scrollBy = scrollBy;

		render(<TestCollapsible />);

		const trigger = screen.getByRole("button", { name: "Toggle chapter" });
		jest.spyOn(trigger, "getBoundingClientRect").mockImplementation(() => createRect(top));

		fireEvent.click(trigger);
		top = 210;
		animationFrame?.(performance.now());

		expect(scrollBy).toHaveBeenCalledWith({ top: -70, left: 0, behavior: "auto" });
	});
});
