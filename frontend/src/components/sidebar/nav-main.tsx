"use client";
import { type Icon, IconCirclePlusFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { stripLocaleFromPathname } from "@/i18n/pathname";
import { cn } from "@/lib/utils";

export function NavMain({
	items,
}: {
	items: Array<{
		title: string;
		url: string;
		icon?: Icon;
	}>;
}) {
	const pathname = stripLocaleFromPathname(usePathname());
	const t = useTranslations("navigation");

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				{pathname.startsWith("/admin") && (
					<SidebarMenu>
						<SidebarMenuItem className="flex items-center gap-2">
							<SidebarMenuButton
								asChild
								tooltip={t("quickCreate")}
								className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
							>
								<Link href="/admin/courses/create">
									<IconCirclePlusFilled />
									<span>{t("quickCreate")}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton tooltip={item.title} asChild>
								<Link
									href={item.url}
									className={cn(pathname === item.url && "bg-accent text-accent-foreground")}
								>
									{item.icon && (
										<item.icon className={cn(pathname === item.url && "text-primary")} />
									)}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
