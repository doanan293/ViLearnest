"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectValue } from "@radix-ui/react-select";
import { Loader2, PlusIcon, SparkleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Resolver, useForm } from "react-hook-form";
import slugify from "slugify";
// import { CreateCourse } from "./action";
import { toast } from "sonner";
import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCourseSingularType } from "@/features/courses";
import { useEditAdminCourseMutation } from "@/features/courses/hooks/use-admin-course-mutations";
import { useRouter } from "@/i18n/navigation";
import {
	type CourseSchemaType,
	courseCategories,
	courseLevels,
	courseSchema,
	courseStatus,
} from "@/lib/zodSchemas";

interface iAppProps {
	data: AdminCourseSingularType;
}

export function EditCourseForm({ data }: iAppProps) {
	const editCourse = useEditAdminCourseMutation(data.id);
	const router = useRouter();
	const t = useTranslations("admin");
	const tErrors = useTranslations("errors");
	//Define your form
	const form = useForm<CourseSchemaType>({
		resolver: zodResolver(courseSchema) as Resolver<CourseSchemaType>,
		defaultValues: {
			title: data.title,
			description: data.description,
			fileKey: data.fileKey,
			price: data.price,
			duration: data.duration,
			level: data.level,
			category: data.category as CourseSchemaType["category"],
			status: data.status,
			slug: data.slug,
			smallDescription: data.smallDescription,
		},
	});

	//Define a submit handler
	function onSubmit(values: CourseSchemaType) {
		editCourse.mutate(values, {
			onSuccess: (result) => {
				if (result.status === "success") {
					toast.success(result.message);
					form.reset();
					router.push("/admin/courses");
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
		<Form {...form}>
			<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("title")}</FormLabel>
							<FormControl>
								<Input placeholder={t("courseTitle")} {...field} />
							</FormControl>
						</FormItem>
					)}
				/>
				<div className="flex gap-4 items-end">
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>{t("slug")}</FormLabel>
								<FormControl>
									<Input placeholder={t("slug")} {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<Button
						type="button"
						className="w-fit"
						onClick={() => {
							const titleValue = form.getValues("title");
							const slug = slugify(titleValue);
							form.setValue("slug", slug, { shouldValidate: true });
						}}
					>
						{t("generateSlug")} <SparkleIcon className="ml-1" size={16} />
					</Button>
				</div>
				<FormField
					control={form.control}
					name="smallDescription"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>{t("smallDescription")}</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("smallDescription")}
									className="min-h-[120px]"
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>{t("description")}</FormLabel>
							<FormControl>
								<RichTextEditor field={field} />
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="fileKey"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>{t("thumbnailImage")}</FormLabel>
							<FormControl>
								<Uploader fileTypeAccepted="image" onChange={field.onChange} value={field.value} />
							</FormControl>
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>{t("category")}</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={t("selectCategory")} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{courseCategories.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="level"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>{t("level")}</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={t("selectLevel")} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{courseLevels.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="duration"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>{t("durationHours")}</FormLabel>
								<FormControl>
									<Input placeholder={t("duration")} type="number" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>{t("priceUsd")}</FormLabel>
								<FormControl>
									<Input placeholder={t("priceUsd")} type="number" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>{t("status")}</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={t("selectStatus")} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{courseStatus.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={editCourse.isPending}>
					{editCourse.isPending ? (
						<>
							{t("uploading")}
							<Loader2 className="animate-spin ml-1" />
						</>
					) : (
						<>
							{t("updateCourse")} <PlusIcon className="ml-1" size={16} />
						</>
					)}
				</Button>
			</form>
		</Form>
	);
}
