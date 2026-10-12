import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/general/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	const tCommon = await getTranslations("common");
	const tAuth = await getTranslations("auth");

	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center">
			<div className="absolute top-4 right-4">
				<LanguageSwitcher />
			</div>
			<Link
				href="/"
				className={buttonVariants({
					variant: "outline",
					className: "absolute top-4 left-4",
				})}
			>
				<ArrowLeft className="size-4" />
				{tCommon("back")}
			</Link>
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Link href="/" className="flex items-center gap-2 self-center font-medium">
					<Logo className="size-8 text-foreground" />
					{tCommon("appName")}
				</Link>
				{children}
				<div className="text-balance text-center text-xs text-muted-foreground">
					{tAuth.rich("agreement", {
						terms: (chunks) => <span className="hover:text-primary hover:underline">{chunks}</span>,
						privacy: (chunks) => (
							<span className="hover:text-primary hover:underline">{chunks}</span>
						),
					})}
				</div>
			</div>
		</div>
	);
}
