import { z } from "zod";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;

export const courseStatus = ["Draft", "Published", "Archived"] as const;

export const profileGenderOptions = ["Male", "Female"] as const;

export const courseCategories = [
	"Development",
	"Business",
	"Finance & Accounting",
	"IT & Software",
	"Office Productivity",
	"Personal Development",
	"Design",
	"Marketing",
	"Health & Fitness",
	"Lifestyle",
	"Music",
	"Teaching & Academics",
] as const;

export const courseSchema = z.object({
	title: z
		.string()
		.min(3, { message: "Title must be at least 3 characters long" })
		.max(100, { message: "Title must be at most 100 characters long" }),
	description: z.string().min(3, { message: "Description must be at least 3 characters long" }),
	fileKey: z.string().min(1, { message: "File is required" }),
	price: z.coerce.number().min(1, { message: "Price must be a positive number" }),
	duration: z.coerce
		.number()
		.min(1, { message: "Duration must be at least 1 hour" })
		.max(500, { message: "Duration must be at most 500 hours" }),
	level: z.enum(courseLevels, { message: "Level is required" }),
	category: z.enum(courseCategories, { message: "Category is required" }),
	smallDescription: z
		.string()
		.min(3, { message: "Small description must be at least 3 characters long" })
		.max(200, {
			message: "Small description must be at most 200 characters long",
		}),
	slug: z.string().min(3, { message: "Slug must be at least 3 characters long" }),
	status: z.enum(courseStatus, { message: "Status is required" }),
});

export const chapterSchema = z.object({
	name: z
		.string()
		.min(3, { message: "Name must be at least 3 characters long" })
		.max(100, { message: "Name must be at most 100 characters long" }),
	courseId: z.string().uuid({ message: "Invalid course ID" }),
});

export const lessonSchema = z.object({
	name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
	courseId: z.string().uuid({ message: "Invalid course ID" }),
	chapterId: z.string().uuid({ message: "Invalid chapter ID" }),
	description: z
		.string()
		.min(3, { message: "Description must be at least 3 characters long" })
		.optional(),
	videoKey: z.string().optional(),
	thumbnailKey: z.string().optional(),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;

export const forgotPasswordRequestSchema = z.object({
	email: z.email({ message: "Enter a valid email address" }),
});

export const resetPasswordSchema = z
	.object({
		email: z.email({ message: "Enter a valid email address" }),
		otp: z.string().length(6, { message: "Enter the 6-digit code" }),
		password: z.string().min(8, { message: "Password must be at least 8 characters" }),
		confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type ForgotPasswordRequestSchemaType = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

const nullableText = (max: number) =>
	z
		.union([z.string(), z.null()])
		.optional()
		.transform((value) => {
			if (value === undefined || value === null) return null;
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : null;
		})
		.refine((value) => !value || value.length <= max, {
			message: `Must be at most ${max} characters`,
		});

const nullableUrl = z
	.union([z.string(), z.null()])
	.optional()
	.transform((value) => {
		if (value === undefined || value === null) return null;
		const trimmed = value.trim();
		if (trimmed.length === 0) return null;
		if (trimmed.length > 240) throw new Error("Must be at most 240 characters");
		const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
		const url = new URL(normalized);
		return `${url.protocol}//${url.host}${url.pathname}${url.search}${url.hash}`;
	});

export const profileSchema = z.object({
	name: z.string().trim().min(1, { message: "Name is required" }).max(100),
	image: nullableText(500),
	dateOfBirth: nullableText(20).refine(
		(value) => !value || new Date(`${value}T00:00:00.000Z`).getTime() <= Date.now(),
		{
			message: "Date of birth cannot be in the future",
		},
	),
	gender: z
		.union([z.enum(profileGenderOptions), z.null()])
		.optional()
		.transform((value) => value ?? null),
	phoneNumber: nullableText(30).refine(
		(value) => !value || /^\+?[0-9][0-9\s().-]{7,28}$/.test(value),
		{
			message: "Enter a valid phone number",
		},
	),
	country: nullableText(100),
	province: nullableText(100),
	district: nullableText(100),
	ward: nullableText(100),
	addressLine: nullableText(240),
	bio: nullableText(500),
	facebookUrl: nullableUrl,
	linkedinUrl: nullableUrl,
	githubUrl: nullableUrl,
	websiteUrl: nullableUrl,
	occupation: nullableText(120),
	organization: nullableText(160),
	education: nullableText(160),
});

export type ProfileSchemaInput = z.input<typeof profileSchema>;
export type ProfileSchemaType = z.infer<typeof profileSchema>;
