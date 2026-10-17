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

// Translatable text is optional per language; an empty string means "not translated yet".
const optionalTitle = z
	.string()
	.max(100, { message: "Title must be at most 100 characters long" })
	.refine((value) => value === "" || value.trim().length >= 3, {
		message: "Title must be at least 3 characters long",
	});

// Every course, chapter and lesson needs a title in at least one language; the error sits on the English field.
function requireOneTitle(enKey: string, viKey: string) {
	return (values: Record<string, unknown>, ctx: z.RefinementCtx) => {
		const en = String(values[enKey] ?? "").trim();
		const vi = String(values[viKey] ?? "").trim();
		if (!en && !vi) {
			ctx.addIssue({
				code: "custom",
				message: "Enter a title in English or Vietnamese",
				path: [enKey],
			});
		}
	};
}

export function slugSource(titleEn?: string | null, titleVi?: string | null): string {
	return titleEn?.trim() ? titleEn : (titleVi ?? "");
}

export const courseSchema = z
	.object({
		titleEn: optionalTitle,
		titleVi: optionalTitle,
		smallDescriptionEn: z
			.string()
			.max(200, { message: "Small description must be at most 200 characters long" }),
		smallDescriptionVi: z
			.string()
			.max(200, { message: "Small description must be at most 200 characters long" }),
		descriptionEn: z.string(),
		descriptionVi: z.string(),
		fileKey: z.string().min(1, { message: "File is required" }),
		price: z.coerce.number().min(1, { message: "Price must be a positive number" }),
		duration: z.coerce
			.number()
			.min(1, { message: "Duration must be at least 1 hour" })
			.max(500, { message: "Duration must be at most 500 hours" }),
		level: z.enum(courseLevels, { message: "Level is required" }),
		category: z.enum(courseCategories, { message: "Category is required" }),
		slug: z.string().min(3, { message: "Slug must be at least 3 characters long" }),
		status: z.enum(courseStatus, { message: "Status is required" }),
	})
	.superRefine(requireOneTitle("titleEn", "titleVi"));

export const chapterSchema = z
	.object({
		nameEn: optionalTitle,
		nameVi: optionalTitle,
		courseId: z.string().uuid({ message: "Invalid course ID" }),
	})
	.superRefine(requireOneTitle("nameEn", "nameVi"));

export const lessonSchema = z
	.object({
		nameEn: optionalTitle,
		nameVi: optionalTitle,
		courseId: z.string().uuid({ message: "Invalid course ID" }),
		chapterId: z.string().uuid({ message: "Invalid chapter ID" }),
		descriptionEn: z.string().optional(),
		descriptionVi: z.string().optional(),
		videoKey: z.string().optional(),
		thumbnailKey: z.string().optional(),
	})
	.superRefine(requireOneTitle("nameEn", "nameVi"));

// API bodies send null for a language that has no text.
export function emptyToNull(value: string | undefined | null): string | null {
	return value?.trim() ? value : null;
}

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;

type NullableFields<T, K extends keyof T> = Omit<T, K> & {
	[P in keyof Pick<T, K>]: Pick<T, K>[P] | null;
};

// Request bodies after emptyToNull: a language with no text is sent as null.
export type ChapterBody = NullableFields<ChapterSchemaType, "nameEn" | "nameVi">;
export type LessonBody = NullableFields<
	LessonSchemaType,
	"nameEn" | "nameVi" | "descriptionEn" | "descriptionVi"
>;

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
