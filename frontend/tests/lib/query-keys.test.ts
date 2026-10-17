import { queryKeys } from "@/lib/query-keys";

describe("queryKeys", () => {
	it("ends course content keys with the locale", () => {
		expect(queryKeys.dashboard.courseSidebar("ai-fast", "vi")).toEqual([
			"dashboard",
			"courseSidebar",
			"ai-fast",
			"vi",
		]);
		expect(queryKeys.dashboard.lessonContent("lesson-1", "en")).toEqual([
			"dashboard",
			"lessonContent",
			"lesson-1",
			"en",
		]);
		expect(queryKeys.courses.publicList("vi")).toEqual(["courses", "publicList", "vi"]);
		expect(queryKeys.courses.publicDetail("ai-fast", "vi")).toEqual([
			"courses",
			"publicDetail",
			"ai-fast",
			"vi",
		]);
		expect(queryKeys.dashboard.enrolledCourses("vi")).toEqual([
			"dashboard",
			"enrolledCourses",
			"vi",
		]);
		expect(queryKeys.dashboard.availableCourses("en")).toEqual([
			"dashboard",
			"availableCourses",
			"en",
		]);
	});

	it("returns stable profile keys", () => {
		expect(queryKeys.profile.me()).toEqual(["profile", "me"]);
		expect(queryKeys.profile.adminUser("user-1")).toEqual(["profile", "adminUser", "user-1"]);
	});

	it("returns stable course and dashboard keys", () => {
		expect(queryKeys.courses.publicList()).toEqual(["courses", "publicList"]);
		expect(queryKeys.courses.publicDetail("react-basics")).toEqual([
			"courses",
			"publicDetail",
			"react-basics",
		]);
		expect(queryKeys.courses.enrollmentStatus("course-1")).toEqual([
			"courses",
			"enrollmentStatus",
			"course-1",
		]);
		expect(queryKeys.dashboard.enrolledCourses()).toEqual(["dashboard", "enrolledCourses"]);
		expect(queryKeys.dashboard.courseSidebar("react-basics")).toEqual([
			"dashboard",
			"courseSidebar",
			"react-basics",
		]);
	});

	it("returns stable admin keys", () => {
		expect(queryKeys.admin.users.list()).toEqual(["admin", "users", "list"]);
		expect(queryKeys.admin.courses.list()).toEqual(["admin", "courses", "list"]);
		expect(queryKeys.admin.courses.detail("course-1")).toEqual([
			"admin",
			"courses",
			"detail",
			"course-1",
		]);
		expect(queryKeys.admin.courseStructure("course-1")).toEqual([
			"admin",
			"courseStructure",
			"course-1",
		]);
		expect(queryKeys.admin.lesson("lesson-1")).toEqual(["admin", "lesson", "lesson-1"]);
	});
});
