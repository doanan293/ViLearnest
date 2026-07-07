describe("avatarUrl", () => {
	beforeEach(() => {
		jest.resetModules();
		jest.doMock("@/lib/env", () => ({
			env: {
				NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: "andv-images",
			},
		}));
	});

	it("keeps absolute image URLs", async () => {
		const { avatarUrl } = await import("@/features/users/utils/avatar-url");

		expect(avatarUrl("https://example.com/avatar.png", "an@example.com")).toBe(
			"https://example.com/avatar.png",
		);
	});

	it("constructs an S3 URL for stored image keys", async () => {
		const { avatarUrl } = await import("@/features/users/utils/avatar-url");

		expect(avatarUrl("uploads/avatar.png", "an@example.com")).toBe(
			"https://andv-images.t3.storage.dev/uploads/avatar.png",
		);
	});

	it("uses the generated avatar when no image is saved", async () => {
		const { avatarUrl } = await import("@/features/users/utils/avatar-url");

		expect(avatarUrl(null, "an@example.com")).toBe("https://avatar.vercel.sh/an@example.com");
	});

	it("constructs a same-origin source URL for editing current avatars", async () => {
		const { avatarSourceUrl } = await import("@/features/users/utils/avatar-url");

		expect(avatarSourceUrl("https://andv-images.t3.storage.dev/uploads/avatar.png")).toBe(
			"/api/avatar-source?url=https%3A%2F%2Fandv-images.t3.storage.dev%2Fuploads%2Favatar.png",
		);
	});
});
