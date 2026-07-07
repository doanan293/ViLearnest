import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-9 w-64" />
			</div>
			<Skeleton className="h-9 w-full rounded-md" />
			<Skeleton className="h-72 w-full rounded-lg" />
			<Skeleton className="h-48 w-full rounded-lg" />
		</div>
	);
}
