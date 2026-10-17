import {
	IconBook,
	IconCategory,
	IconChartBar,
	IconChevronDown,
	IconClock,
	IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getIndividualCourse } from "@/features/courses";
import { categoryLabel, levelLabel } from "@/lib/course-labels";
import { env } from "@/lib/env";
import { EnrollmentCta } from "./_components/EnrollmentCta";

type Params = Promise<{ slug: string }>;

export default async function SlugPage({ params }: { params: Params }) {
	const { slug } = await params;
	const t = await getTranslations("courses");
	const course = await getIndividualCourse(slug);

	return (
		<div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-5">
			<div className="order-1 lg:col-span-2">
				<div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
					<Image
						src={`https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${course.fileKey}`}
						alt={course.title}
						fill
						className="object-cover"
						sizes="(max-width: 1024px) 100vw, 66vw"
						priority
					/>
				</div>
				<div className="mt-8 space-y-6">
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
						<p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
							{course.smallDescription}
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Badge className="flex items-center gap-1 px-3 py-1">
							<IconChartBar className="size-4" />
							<span>{levelLabel(t, course.level)}</span>
						</Badge>
						<Badge className="flex items-center gap-1 px-3 py-1">
							<IconCategory className="size-4" />
							<span>{categoryLabel(t, course.category)}</span>
						</Badge>
						<Badge className="flex items-center gap-1 px-3 py-1">
							<IconClock className="size-4" />
							<span>
								{course.duration} {t("hours")}
							</span>
						</Badge>
					</div>
					<Separator className="my-8" />
					<div className="space-y-6">
						<h2 className="text-3xl font-semibold tracking-tight">{t("descriptionTitle")}</h2>
						<RenderDescription json={course.description ? JSON.parse(course.description) : null} />
					</div>
				</div>
				<div className="mt-12 space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-3xl font-semibold tracking-tight">{t("contentTitle")}</h2>
						<div>
							{course.chapter.length} {t("chapters")} |{" "}
							{course.chapter.reduce((total, chapter) => total + chapter.lessons.length, 0) || 0}{" "}
							{t("lessons")}
						</div>
					</div>
					<div className="space-y-4">
						{course.chapter.map((chapter, index) => (
							<Collapsible key={chapter.id} defaultOpen={index === 0}>
								<Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
									<CollapsibleTrigger>
										<div>
											<CardContent className="p-6 hover:bg-muted/50 transition-colors">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														<p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
															{index + 1}
														</p>
														<div>
															<h3 className="text-xl font-semibold text-left">{chapter.title}</h3>
															<p className="text-sm text-muted-foreground mt-1 text-left">
																{chapter.lessons.length} {t("lessons")}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-3">
														<Badge variant="outline" className="text-xs">
															{chapter.lessons.length} {t("lessons")}
														</Badge>
														<IconChevronDown className="size-5 text-muted-foreground" />
													</div>
												</div>
											</CardContent>
										</div>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="border-t bg-muted/20">
											<div className="p-6 pt-4 space-y-3">
												{chapter.lessons.map((lesson, lessonIndex) => (
													<div
														key={lesson.id}
														className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors"
													>
														<div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
															<IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
														</div>

														<div className="flex-1">
															<p className="font-medium text-sm">{lesson.title}</p>
															<p className="text-xs text-muted-foreground mt-1">
																{t("lesson")} {lessonIndex + 1}
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									</CollapsibleContent>
								</Card>
							</Collapsible>
						))}
					</div>
				</div>
			</div>
			{/* Enrollment Card */}
			<div className="order-2 lg:col-span-1">
				<div className="sticky top-20">
					<Card className="py-0">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-6">
								<span className="text-lg font-medium">{t("price")}</span>
								<span className="text-2xl font-bold text-primary">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(course.price)}
								</span>
							</div>
							<div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
								<h4 className="font-medium">{t("whatYouWillGet")}</h4>
								<div className="flex flex-col gap-3">
									<div className="flex items-center gap-3">
										<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconClock className="size-4" />
										</div>
										<div>
											<p>{t("courseDuration")}</p>
											<p className="text-sm text-muted-foreground">
												{course.duration} {t("hours")}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconChartBar className="size-4" />
										</div>
										<div>
											<p>{t("difficultyLevel")}</p>
											<p className="text-sm text-muted-foreground">{levelLabel(t, course.level)}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconCategory className="size-4" />
										</div>
										<div>
											<p>{t("category")}</p>
											<p className="text-sm text-muted-foreground">
												{categoryLabel(t, course.category)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconBook className="size-4" />
										</div>
										<div>
											<p>{t("totalLessons")}</p>
											<p className="text-sm text-muted-foreground">
												{course.chapter.reduce(
													(total, chapter) => total + chapter.lessons.length,
													0,
												) || 0}{" "}
												{t("lessons")}
											</p>
										</div>
									</div>
								</div>
							</div>
							<div className="mb-6 space-y-3">
								<h4>{t("courseIncludes")}</h4>
								<ul className="space-y-2">
									<li className="flex items-center gap-2 text-sm">
										<div className="rounded-full p-1 bg-green-500/10 text-green-500">
											<CheckIcon className="size-3" />
										</div>
										<span>{t("fullLifetimeAccess")}</span>
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="rounded-full p-1 bg-green-500/10 text-green-500">
											<CheckIcon className="size-3" />
										</div>
										<span>{t("accessMobileDesktop")}</span>
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="rounded-full p-1 bg-green-500/10 text-green-500">
											<CheckIcon className="size-3" />
										</div>
										<span>{t("certificate")}</span>
									</li>
								</ul>
							</div>
							<EnrollmentCta courseId={course.id} />
							<p className="mt-3 text-center text-xs text-muted-foreground">
								{t("moneyBackGuarantee")}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
