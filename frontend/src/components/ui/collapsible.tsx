"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { useStableScrollOnToggle } from "@/hooks/use-stable-scroll-on-toggle";

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
	onClick,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
	const preserveScrollPosition = useStableScrollOnToggle();

	return (
		<CollapsiblePrimitive.CollapsibleTrigger
			{...props}
			data-slot="collapsible-trigger"
			onClick={(event) => {
				preserveScrollPosition(event.currentTarget);
				onClick?.(event);
			}}
		/>
	);
}

function CollapsibleContent({
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
	return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
