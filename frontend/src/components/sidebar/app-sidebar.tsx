"use client";
import {
	IconChartBar,
	IconDashboard,
	IconFolder,
	IconHelp,
	IconListDetails,
	IconSearch,
	IconSettings,
	IconUsers,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Logo } from "@/components/Logo";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const t = useTranslations("navigation");
	const tCommon = useTranslations("common");
	const data = {
		navMain: [
			{ title: t("dashboard"), url: "/admin", icon: IconDashboard },
			{ title: t("courses"), url: "/admin/courses", icon: IconListDetails },
			{ title: t("analytics"), url: "#", icon: IconChartBar },
			{ title: t("projects"), url: "#", icon: IconFolder },
			{ title: t("team"), url: "/admin/users", icon: IconUsers },
		],
		navSecondary: [
			{ title: t("settings"), url: "#", icon: IconSettings },
			{ title: t("getHelp"), url: "#", icon: IconHelp },
			{ title: t("search"), url: "#", icon: IconSearch },
		],
	};

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
							<Link href="/">
								<Logo className="size-5 text-sidebar-foreground" />
								<span className="text-base font-semibold">{tCommon("appName")}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
