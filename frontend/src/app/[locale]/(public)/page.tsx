import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const features = [
	{ key: "comprehensiveCourses", icon: "📚" },
	{ key: "interactiveLearning", icon: "🎮" },
	{ key: "progressTracking", icon: "📈" },
	{ key: "communitySupport", icon: "🤝" },
] as const;

export default async function Home() {
	const t = await getTranslations("publicHome");

	return (
		<>
			<section className="relative py-20">
				<div className="flex flex-col items-center text-center space-y-8">
					<Badge variant="outline">{t("badge")}</Badge>
					<h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t("title")}</h1>
					<p className="max-w-[700px] text-muted-foreground md:text-xl">{t("description")}</p>
					<div className="flex flex-col sm:flex-row gap-4 mt-8">
						<Link className={buttonVariants({ size: "lg" })} href="/courses">
							{t("exploreCourses")}
						</Link>
					</div>
				</div>
			</section>
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
				{features.map((feature) => (
					<Card key={feature.key} className="hover:shadow-lg transition-shadow">
						<CardHeader>
							<div className="text-4xl mb-4">{feature.icon}</div>
							<h2 className="font-semibold">{t(`features.${feature.key}.title`)}</h2>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">{t(`features.${feature.key}.description`)}</p>
						</CardContent>
					</Card>
				))}
			</section>
		</>
	);
}
