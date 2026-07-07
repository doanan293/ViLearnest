const minute = 1000 * 60;

export const queryStaleTimes = {
	default: minute * 5,
	adminEdit: minute,
	coursePlayer: minute,
	dashboard: minute * 2,
	enrollment: minute * 2,
	profile: minute * 5,
	adminList: minute * 5,
	catalog: minute * 15,
} as const;
