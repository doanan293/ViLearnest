import { UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SettingsSidebar({ active = "profile" }: { active?: "profile" }) {
	return (
		<nav aria-label="Settings navigation" className="w-full shrink-0 md:w-56">
			<Link
				href="/dashboard/settings/profile"
				className={cn(
					"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
					active === "profile" && "bg-accent text-accent-foreground",
				)}
			>
				<UserRound className="size-4" />
				Profile
			</Link>
		</nav>
	);
}
