import { useCallback, useEffect, useRef } from "react";

export function useStableScrollOnToggle() {
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (animationFrameRef.current !== null) {
				window.cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	return useCallback((element: HTMLElement | null) => {
		if (typeof window === "undefined" || !element) return;

		const previousTop = element.getBoundingClientRect().top;

		if (animationFrameRef.current !== null) {
			window.cancelAnimationFrame(animationFrameRef.current);
		}

		animationFrameRef.current = window.requestAnimationFrame(() => {
			animationFrameRef.current = null;

			if (!element.isConnected) return;

			const nextTop = element.getBoundingClientRect().top;
			const topDelta = nextTop - previousTop;

			if (topDelta === 0) return;

			window.scrollBy({ top: topDelta, left: 0, behavior: "auto" });
		});
	}, []);
}
