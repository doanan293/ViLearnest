"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "label",
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			captionLayout={captionLayout}
			className={cn("p-3", className)}
			classNames={{
				root: cn("w-fit", classNames?.root),
				months: cn("relative flex flex-col gap-4 sm:flex-row", classNames?.months),
				month: cn("w-full space-y-4", classNames?.month),
				month_caption: cn("flex h-7 items-center justify-center", classNames?.month_caption),
				caption_label: cn("text-sm font-medium", classNames?.caption_label),
				nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", classNames?.nav),
				button_previous: cn(
					buttonVariants({ variant: "outline" }),
					"size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
					classNames?.button_previous,
				),
				button_next: cn(
					buttonVariants({ variant: "outline" }),
					"size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
					classNames?.button_next,
				),
				month_grid: cn("w-full border-collapse", classNames?.month_grid),
				weekdays: cn("flex", classNames?.weekdays),
				weekday: cn(
					"text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal",
					classNames?.weekday,
				),
				week: cn("mt-2 flex w-full", classNames?.week),
				day: cn(
					"relative flex size-9 flex-1 items-center justify-center p-0 text-center text-sm",
					classNames?.day,
				),
				day_button: cn(
					buttonVariants({ variant: "ghost" }),
					"size-9 p-0 font-normal aria-selected:opacity-100",
					classNames?.day_button,
				),
				selected: cn(
					"[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
					classNames?.selected,
				),
				today: cn("[&>button]:bg-accent [&>button]:text-accent-foreground", classNames?.today),
				outside: cn(
					"text-muted-foreground aria-selected:text-muted-foreground opacity-50",
					classNames?.outside,
				),
				disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
				hidden: cn("invisible", classNames?.hidden),
				...classNames,
			}}
			components={{
				Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
					const Icon =
						orientation === "left"
							? ChevronLeftIcon
							: orientation === "right"
								? ChevronRightIcon
								: orientation === "up"
									? ChevronUpIcon
									: ChevronDownIcon;

					return <Icon className={cn("size-4", chevronClassName)} {...chevronProps} />;
				},
				...props.components,
			}}
			{...props}
		/>
	);
}

export { Calendar };
