import { ArrowLeft, ShieldX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function NotAdminRoute() {
	const t = await getTranslations("access");

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<div className="bg-destructive/10 rounded-full p-4 w-fit mx-auto">
						<ShieldX className="size-16 text-destructive" />
					</div>
					<CardTitle className="text-2xl">{t("restrictedTitle")}</CardTitle>
					<CardDescription className="max-w-xs mx-auto">
						{t("restrictedDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/" className={buttonVariants({ className: "w-full" })}>
						<ArrowLeft className="mr-1 size-4" />
						{t("backHome")}
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
