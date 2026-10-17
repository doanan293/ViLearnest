import type { Locale } from "@/i18n/pathname";

// Course content keys end with the locale. Without a locale the key is a prefix that matches
// every language, which is what invalidation after a write needs.
function localized<const T extends ReadonlyArray<string>>(key: T, locale?: Locale) {
	return locale ? ([...key, locale] as const) : key;
}

export const queryKeys = {
	auth: {
		session: () => ["auth", "session"] as const,
	},
	profile: {
		me: () => ["profile", "me"] as const,
		adminUser: (userId: string) => ["profile", "adminUser", userId] as const,
	},
	courses: {
		publicList: (locale?: Locale) => localized(["courses", "publicList"] as const, locale),
		publicDetail: (slug: string, locale?: Locale) =>
			localized(["courses", "publicDetail", slug] as const, locale),
		enrollmentStatus: (courseId: string) => ["courses", "enrollmentStatus", courseId] as const,
	},
	dashboard: {
		enrolledCourses: (locale?: Locale) =>
			localized(["dashboard", "enrolledCourses"] as const, locale),
		availableCourses: (locale?: Locale) =>
			localized(["dashboard", "availableCourses"] as const, locale),
		courseSidebar: (slug: string, locale?: Locale) =>
			localized(["dashboard", "courseSidebar", slug] as const, locale),
		lessonContent: (lessonId: string, locale?: Locale) =>
			localized(["dashboard", "lessonContent", lessonId] as const, locale),
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
