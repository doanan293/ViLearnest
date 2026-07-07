"use client";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/general/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/features/auth";
import { avatarUrl } from "@/features/users/utils/avatar-url";
import { Link } from "@/i18n/navigation";
import { UserDropdown } from "./UserDropdown";

export default function Navbar() {
	const { data: session, isPending } = authClient.useSession();
	const t = useTranslations("navigation");
	const tAuth = useTranslations("auth.login");
	const navigationItems = [
		{ name: t("home"), href: "/" },
		{ name: t("courses"), href: "/courses" },
		{ name: t("dashboard"), href: "/dashboard" },
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60">
			<div className="container flex min-h-16 items-center mx-auto px-4 md:px-6 lg:px-8">
				<Link href="/" className="flex items-center space-x-2 mr-4">
					<Logo className="size-9 text-foreground" />
					<span className="font-bold">AndvLMS</span>
				</Link>
				<nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
					<div className="flex items-center space-x-2">
						{navigationItems.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="text-sm font-medium transition-colors hover:text-primary"
							>
								{item.name}
							</Link>
						))}
					</div>
					<div className="flex min-w-48 items-center justify-end space-x-4">
						<LanguageSwitcher />
						<ThemeToggle />
						{isPending ? null : session ? (
							<UserDropdown
								email={session.user.email}
								image={avatarUrl(session.user.image, session.user.email)}
								name={
									session.user.name && session.user.name.length > 0
										? session.user.name
										: session.user.email.split("@")[0]
								}
							/>
						) : (
							<>
								<Link href="/login" className={buttonVariants({ variant: "secondary" })}>
									{tAuth("signIn")}
								</Link>
								<Link href="/login?tab=signup" className={buttonVariants()}>
									{tAuth("signUp")}
								</Link>
							</>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
}
