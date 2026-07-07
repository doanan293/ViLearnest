import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CourseSchemaType } from "@/lib/zodSchemas";

type EditableCourse = {
	id: string;
	slug: string;
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
) {
	queryClient.setQueryData(queryKeys.admin.courses.detail(course.id), course);
	await Promise.all([
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

	return useMutation({
		mutationFn: (values: CourseSchemaType) => api.admin.editCourse(courseId, values),
		onSuccess: async (_result, values) => {
			await updateAdminCourseEdit(queryClient, { id: courseId, ...values });
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
