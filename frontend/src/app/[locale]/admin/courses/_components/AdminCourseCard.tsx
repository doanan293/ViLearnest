"use client";

import { ArrowRight, Eye, MoreVertical, Pencil, School, TimerIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminCourseType } from "@/features/courses";
import { useAdminCourseIntentPrefetch } from "@/features/courses/hooks/use-intent-prefetch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/pathname";
import { levelLabel } from "@/lib/course-labels";
import { pickLocalized } from "@/lib/localized-text";

interface iAppProps {
	data: AdminCourseType;
}

export function AdminCourseCard({ data }: iAppProps) {
	const thumbnailUrl = useConstructUrl(data.fileKey);
	const t = useTranslations("admin");
	const tCourses = useTranslations("courses");
	const locale = useLocale() as Locale;
	const prefetchAdminCourse = useAdminCourseIntentPrefetch(data.id);

	return (
		<Card className="group relative py-0">
			<div className="absolute top-2 right-2 z-10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="secondary" size="icon">
							<MoreVertical className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem asChild>
							<Link
								href={`/admin/courses/${data.id}/edit`}
								onFocus={prefetchAdminCourse}
								onPointerEnter={prefetchAdminCourse}
								onTouchStart={prefetchAdminCourse}
							>
								<Pencil className="size-4 mr-2" />
								{t("editCourseAction")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`/courses/${data.slug}`}>
								<Eye className="size-4 mr-2" />
								{t("preview")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href={`/admin/courses/${data.id}/delete`}>
								<Trash2 className="size-4 mr-2 text-destructive" />
								{t("deleteCourseAction")}
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Image
				src={thumbnailUrl}
				alt={t("thumbnailAlt")}
				width={600}
				height={400}
				className="w-full rounded-t-lg aspect-video h-full object-cover"
				sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
			/>
			<CardContent className="p-4">
				<Link
					href={`/admin/courses/${data.id}/edit`}
					className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
					onFocus={prefetchAdminCourse}
					onPointerEnter={prefetchAdminCourse}
					onTouchStart={prefetchAdminCourse}
				>
					{pickLocalized(data, "title", locale) ?? data.title}
				</Link>
				<p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
					{pickLocalized(data, "smallDescription", locale)}
				</p>
				<div className="mt-4 flex items-center gap-x-5">
					<div className="flex items-center gap-x-2">
						<TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
						<p className="text-sm text-muted-foreground">{data.duration}h</p>
					</div>
					<div className="flex items-center gap-x-2">
						<School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
						<p className="text-sm text-muted-foreground">{levelLabel(tCourses, data.level)}</p>
					</div>
				</div>

				<Link
					className={buttonVariants({ className: "w-full mt-4" })}
					href={`/admin/courses/${data.id}/edit`}
					onFocus={prefetchAdminCourse}
					onPointerEnter={prefetchAdminCourse}
					onTouchStart={prefetchAdminCourse}
				>
					{t("editCourseAction")} <ArrowRight className="size-4 " />
				</Link>
			</CardContent>
		</Card>
	);
}

export function AdminCourseCardSkeleton() {
	return (
		<Card className="group relative py-0 gap-0">
			<div className="absolute top-2 right-2 z-10 flex items-center gap-2">
				<Skeleton className="h-6 w-16 rounded-full" />
				<Skeleton className="size-8 rounded-md" />
			</div>
			<div className="w-full relative h-fit">
				<Skeleton className="w-full rounded-t-lg aspect-video h-[250px] object-cover" />
			</div>
			<CardContent className="p-4">
				<Skeleton className="size-6 rounded-md" />
				<Skeleton className="h-4 w-10 rounded" />
				<div className="mt-4 flex items-center gap-x-5">
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-10 rounded" />
					</div>
					<div className="flex items-center gap-x-2">
						<Skeleton className="size-6 rounded-md" />
						<Skeleton className="h-4 w-10 rounded" />
					</div>
				</div>
				<Skeleton className="mt-4 h-10 w-full rounded" />
			</CardContent>
		</Card>
	);
}
