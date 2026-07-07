import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div className="order-1 space-y-8 lg:col-span-2">
				<Skeleton className="aspect-video w-full rounded-xl" />
				<div className="space-y-4">
					<Skeleton className="h-10 w-3/4" />
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-2/3" />
					<div className="flex gap-3">
						<Skeleton className="h-7 w-24" />
						<Skeleton className="h-7 w-28" />
						<Skeleton className="h-7 w-20" />
					</div>
				</div>
				<div className="space-y-3">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-4/6" />
				</div>
			</div>
			<div className="order-2 lg:col-span-1">
				<Skeleton className="h-80 w-full rounded-lg" />
			</div>
		</div>
	);
}
