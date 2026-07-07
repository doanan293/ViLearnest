import { BookOpen, ChevronDownIcon, Home, LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth";
import { Link } from "@/i18n/navigation";

interface iAppProps {
	name: string;
	email: string;
	image: string;
}

export function UserDropdown({ email, name, image }: iAppProps) {
	const handleSignOut = useSignOut();
	const tCommon = useTranslations("common");
	const t = useTranslations("navigation");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
					<Avatar>
						<AvatarImage src={image} alt={tCommon("profileImage")} />
						<AvatarFallback>{name[0].toUpperCase()}</AvatarFallback>
					</Avatar>
					<ChevronDownIcon size={16} className="opacity-60" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-48">
				<DropdownMenuLabel className="flex min-w-0 flex-col">
					<span className="text-foreground truncate text-sm font-medium">{name}</span>
					<span className="text-muted-foreground truncate text-xs font-normal">{email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/">
							<Home size={16} className="opacity-60" aria-hidden="true" />
							<span>{t("home")}</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/courses">
							<BookOpen size={16} className="opacity-60" aria-hidden="true" />
							<span>{t("courses")}</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/dashboard">
							<LayoutDashboardIcon size={16} className="opacity-60" aria-hidden="true" />
							<span>{t("dashboard")}</span>
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut}>
					<LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
					<span>{t("logout")}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
