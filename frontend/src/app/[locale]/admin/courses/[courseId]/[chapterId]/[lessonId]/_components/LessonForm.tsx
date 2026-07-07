"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AdminLessonType } from "@/features/courses";
import { adminLessonQueryOptions } from "@/features/courses/hooks/use-admin-course-queries";
import { useUpdateLessonMutation } from "@/features/courses/hooks/use-admin-course-structure-mutations";
import { Link } from "@/i18n/navigation";
import { type LessonSchemaType, lessonSchema } from "@/lib/zodSchemas";

interface iAppProps {
	data: AdminLessonType;
	chapterId: string;
	courseId: string;
}

export function LessonForm({ data, chapterId, courseId }: iAppProps) {
	const { data: lesson = data } = useQuery(adminLessonQueryOptions(data.id));
	const updateLesson = useUpdateLessonMutation(courseId, lesson.id);
	const t = useTranslations("admin");
	const tErrors = useTranslations("errors");

	const form = useForm<LessonSchemaType>({
		resolver: zodResolver(lessonSchema) as Resolver<LessonSchemaType>,
		defaultValues: {
			name: lesson.title,
			chapterId: chapterId,
			courseId: courseId,
			description: lesson.description ?? undefined,
			videoKey: lesson.videoKey ?? undefined,
			thumbnailKey: lesson.thumbnailKey ?? undefined,
		},
	});

	function onSubmit(values: LessonSchemaType) {
		updateLesson.mutate(values, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
				} else if (result.status === "error") {
					toast.error(result.message);
				}
			},
			onError: () => {
				toast.error(tErrors("unexpected"));
			},
		});
	}

	return (
		<div>
			<Link
				className={buttonVariants({ variant: "outline", className: "mb-6" })}
				href={`/admin/courses/${courseId}/edit`}
			>
				<ArrowLeft className="size-4" />
				<span>{t("goBack")}</span>
			</Link>
			<Card>
				<CardHeader>
					<CardTitle>{t("lessonConfiguration")}</CardTitle>
					<CardDescription>{t("lessonConfigurationDescription")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("lessonNameLabel")}</FormLabel>
										<FormControl>
											<Input placeholder={t("lessonNamePlaceholder")} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("description")}</FormLabel>
										<FormControl>
											<RichTextEditor field={{ ...field, value: field.value || "" }} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="thumbnailKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("thumbnailImage")}</FormLabel>
										<FormControl>
											<Uploader
												fileTypeAccepted="image"
												onChange={field.onChange}
												value={field.value}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="videoKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("videoFile")}</FormLabel>
										<FormControl>
											<Uploader
												onChange={field.onChange}
												value={field.value}
												fileTypeAccepted="video"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button disabled={updateLesson.isPending} type="submit">
								{updateLesson.isPending ? t("saving") : t("saveLesson")}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
