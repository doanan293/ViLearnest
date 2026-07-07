import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-80" />
			</div>
			<div className="space-y-4">
				<Skeleton className="size-20 rounded-lg" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-28 w-full" />
			</div>
		</div>
	);
}
