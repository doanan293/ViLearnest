export const queryKeys = {
	auth: {
		session: () => ["auth", "session"] as const,
	},
	profile: {
		me: () => ["profile", "me"] as const,
		adminUser: (userId: string) => ["profile", "adminUser", userId] as const,
	},
	courses: {
		publicList: () => ["courses", "publicList"] as const,
		publicDetail: (slug: string) => ["courses", "publicDetail", slug] as const,
		enrollmentStatus: (courseId: string) => ["courses", "enrollmentStatus", courseId] as const,
	},
	dashboard: {
		enrolledCourses: () => ["dashboard", "enrolledCourses"] as const,
		availableCourses: () => ["dashboard", "availableCourses"] as const,
		courseSidebar: (slug: string) => ["dashboard", "courseSidebar", slug] as const,
		lessonContent: (lessonId: string) => ["dashboard", "lessonContent", lessonId] as const,
	},
	admin: {
		users: {
			list: () => ["admin", "users", "list"] as const,
		},
		courses: {
			list: () => ["admin", "courses", "list"] as const,
			detail: (courseId: string) => ["admin", "courses", "detail", courseId] as const,
			recent: () => ["admin", "courses", "recent"] as const,
		},
		dashboard: {
			stats: () => ["admin", "dashboard", "stats"] as const,
			enrollmentStats: () => ["admin", "dashboard", "enrollmentStats"] as const,
		},
		courseStructure: (courseId: string) => ["admin", "courseStructure", courseId] as const,
		lesson: (lessonId: string) => ["admin", "lesson", lessonId] as const,
	},
} as const;
