import { queryStaleTimes } from "@/lib/query-stale-times";

describe("queryStaleTimes", () => {
	it("defines freshness windows by data ownership", () => {
		expect(queryStaleTimes.adminEdit).toBeLessThan(queryStaleTimes.profile);
		expect(queryStaleTimes.coursePlayer).toBeLessThan(queryStaleTimes.catalog);
		expect(queryStaleTimes.dashboard).toBeLessThan(queryStaleTimes.catalog);
		expect(queryStaleTimes.default).toBe(1000 * 60 * 5);
	});
});
