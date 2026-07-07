import { QueryClient } from "@tanstack/react-query";
import {
	invalidateAdminCourseCreate,
	invalidateAdminCourseDelete,
	updateAdminCourseEdit,
} from "@/features/courses/hooks/use-admin-course-mutations";
import { queryKeys } from "@/lib/query-keys";

describe("admin course mutation cache effects", () => {
	it("invalidates list, recent, dashboard stats, and public list after create", async () => {
		const queryClient = new QueryClient();
		const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

		await invalidateAdminCourseCreate(queryClient);

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.courses.list() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.courses.recent() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.dashboard.stats() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.courses.publicList() });
	});

	it("updates detail and invalidates affected lists after edit", async () => {
		const queryClient = new QueryClient();
		const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
		const course = { id: "course-1", slug: "react-basics", title: "React Basics" };

		await updateAdminCourseEdit(queryClient, course);

		expect(queryClient.getQueryData(queryKeys.admin.courses.detail("course-1"))).toEqual(course);
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.courses.list() });
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: queryKeys.courses.publicDetail("react-basics"),
		});
	});

	it("removes detail and invalidates affected lists after delete", async () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(queryKeys.admin.courses.detail("course-1"), { id: "course-1" });
		const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

		await invalidateAdminCourseDelete(queryClient, "course-1");

		expect(queryClient.getQueryData(queryKeys.admin.courses.detail("course-1"))).toBeUndefined();
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.admin.courses.list() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.courses.publicList() });
	});
});
