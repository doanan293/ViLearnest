import {
	adminProfileQueryOptions,
	profileQueryOptions,
} from "@/features/users/hooks/use-profile-query";
import { queryKeys } from "@/lib/query-keys";
import { queryStaleTimes } from "@/lib/query-stale-times";

describe("profile query options", () => {
	it("uses central query keys for current and admin profiles", () => {
		expect(profileQueryOptions().queryKey).toEqual(queryKeys.profile.me());
		expect(adminProfileQueryOptions("user-1").queryKey).toEqual(
			queryKeys.profile.adminUser("user-1"),
		);
		expect(profileQueryOptions().staleTime).toBe(queryStaleTimes.profile);
		expect(adminProfileQueryOptions("user-1").staleTime).toBe(queryStaleTimes.profile);
	});
});
