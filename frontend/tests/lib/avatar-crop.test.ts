import { cropAvatarImage } from "@/features/users/utils/avatar-crop";

describe("cropAvatarImage", () => {
	const originalCreateElement = document.createElement.bind(document);

	afterEach(() => {
		jest.restoreAllMocks();
		document.createElement = originalCreateElement;
	});

	it("exports a square jpeg file from the selected crop", async () => {
		const drawImage = jest.fn();
		const toBlob = jest.fn((callback: BlobCallback) => {
			callback(new Blob(["cropped"], { type: "image/jpeg" }));
		});

		document.createElement = ((tagName: string) => {
			if (tagName === "canvas") {
				return {
					width: 0,
					height: 0,
					getContext: () => ({ drawImage }),
					toBlob,
				} as unknown as HTMLCanvasElement;
			}
			return originalCreateElement(tagName);
		}) as typeof document.createElement;

		const image = {
			naturalWidth: 1200,
			naturalHeight: 800,
		} as HTMLImageElement;

		const file = await cropAvatarImage(image, {
			outputSize: 320,
			zoom: 1.5,
			offsetX: 20,
			offsetY: -10,
			sourceName: "avatar.png",
		});

		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe("avatar-cropped.jpg");
		expect(file.type).toBe("image/jpeg");
		expect(drawImage).toHaveBeenCalledWith(
			image,
			expect.any(Number),
			expect.any(Number),
			expect.any(Number),
			expect.any(Number),
			0,
			0,
			320,
			320,
		);
		expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.82);
	});

	it("rejects when the canvas cannot export an image", async () => {
		document.createElement = ((tagName: string) => {
			if (tagName === "canvas") {
				return {
					width: 0,
					height: 0,
					getContext: () => ({ drawImage: jest.fn() }),
					toBlob: (callback: BlobCallback) => callback(null),
				} as unknown as HTMLCanvasElement;
			}
			return originalCreateElement(tagName);
		}) as typeof document.createElement;

		await expect(
			cropAvatarImage({ naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement, {
				outputSize: 512,
				zoom: 1,
				offsetX: 0,
				offsetY: 0,
				sourceName: "avatar.png",
			}),
		).rejects.toThrow("Could not edit avatar");
	});
});
