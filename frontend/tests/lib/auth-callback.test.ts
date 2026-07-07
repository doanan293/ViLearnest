import { getAuthCallbackURL } from "@/features/auth/lib/auth-callback";

describe("getAuthCallbackURL", () => {
	it("builds an absolute locale-aware callback URL", () => {
		expect(getAuthCallbackURL("https://app.example.com", "vi")).toBe("https://app.example.com/vi");
	});
});
