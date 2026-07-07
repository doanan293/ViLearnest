import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="space-y-3">
				{Array.from({ length: 6 }, (_, index) => `admin-user-row-${index + 1}`).map((key) => (
					<Skeleton key={key} className="h-14 w-full rounded-md" />
				))}
			</div>
		</div>
	);
}
