import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("profile and admin users query hydration boundaries", () => {
	it("hydrates the current profile settings page", () => {
		const source = readFileSync(
			join(root, "src/app/[locale]/dashboard/settings/profile/page.tsx"),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("profileQueryOptions");
		expect(source).toContain("getProfile");
	});

	it("hydrates the admin user profile page", () => {
		const source = readFileSync(
			join(root, "src/app/[locale]/admin/users/[userId]/profile/page.tsx"),
			"utf8",
		);
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminProfileQueryOptions");
		expect(source).toContain("adminGetUserProfile");
		expect(source).toContain("<AdminProfileSettingsClient userId={userId} />");
	});

	it("hydrates the admin users list page", () => {
		const source = readFileSync(join(root, "src/app/[locale]/admin/users/page.tsx"), "utf8");
		expect(source).toContain("QueryHydrationBoundary");
		expect(source).toContain("adminUsersQueryOptions");
		expect(source).toContain("adminGetUsers");
		expect(source).toContain("<AdminUsersClientSection />");
	});
});
