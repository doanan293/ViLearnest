import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/pathname";
import { api } from "@/lib/api";
import { pickLocalized } from "@/lib/localized-text";
import { queryKeys } from "@/lib/query-keys";
import type { CourseSchemaType } from "@/lib/zodSchemas";

type EditableCourse = {
	id: string;
	slug: string;
	title?: string;
	titleEn?: string | null;
	titleVi?: string | null;
};

export async function invalidateAdminCourseCreate(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.list() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.recent() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.stats() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.courses.publicList() }),
	]);
}

export async function updateAdminCourseEdit<TCourse extends EditableCourse>(
	queryClient: QueryClient,
	course: TCourse,
	locale: Locale,
) {
	// Merge so the cached chapters survive, and recompute the display title from the edited languages.
	const title = pickLocalized(course, "title", locale) ?? course.title;
	queryClient.setQueryData(queryKeys.admin.courses.detail(course.id), (previous?: object) => ({
		...previous,
		...course,
		title,
	}));
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(course.id) }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.list() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.recent() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.courses.publicList() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.courses.publicDetail(course.slug) }),
	]);
}

export async function invalidateAdminCourseDelete(queryClient: QueryClient, courseId: string) {
	queryClient.removeQueries({ queryKey: queryKeys.admin.courses.detail(courseId) });
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.list() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.recent() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.stats() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.courses.publicList() }),
	]);
}

export function useCreateAdminCourseMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (values: CourseSchemaType) => api.admin.createCourse(values),
		onSuccess: async () => {
			await invalidateAdminCourseCreate(queryClient);
		},
	});
}

export function useEditAdminCourseMutation(courseId: string) {
	const queryClient = useQueryClient();
	const locale = useLocale() as Locale;

	return useMutation({
		mutationFn: (values: CourseSchemaType) => api.admin.editCourse(courseId, values),
		onSuccess: async (_result, values) => {
			await updateAdminCourseEdit(queryClient, { id: courseId, ...values }, locale);
		},
	});
}

export function useDeleteAdminCourseMutation(courseId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.admin.deleteCourse(courseId),
		onSuccess: async () => {
			await invalidateAdminCourseDelete(queryClient, courseId);
		},
	});
}
