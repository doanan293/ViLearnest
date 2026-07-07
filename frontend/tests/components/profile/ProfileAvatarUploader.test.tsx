import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProfileAvatarUploader } from "@/features/users/components/ProfileAvatarUploader";
import { cropAvatarImage } from "@/features/users/utils/avatar-crop";

const mockUploadMutateAsync = jest.fn();

jest.mock("@/lib/env", () => ({
	env: {
		NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: "andv-images",
	},
}));

jest.mock("@/components/file-uploader/use-file-upload-mutations", () => ({
	useFileUploadMutation: () => ({
		mutateAsync: mockUploadMutateAsync,
	}),
}));

jest.mock("@/features/users/utils/avatar-crop", () => ({
	cropAvatarImage: jest.fn(),
}));

jest.mock("sonner", () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}));

describe("ProfileAvatarUploader", () => {
	beforeEach(() => {
		URL.createObjectURL = jest.fn(() => "blob:avatar-preview");
		URL.revokeObjectURL = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("opens the avatar editor after selecting a valid image", async () => {
		render(
			<ProfileAvatarUploader
				value={null}
				name="An Nguyen"
				email="an@example.com"
				onChange={jest.fn()}
			/>,
		);

		const file = new File(["avatar"], "avatar.png", { type: "image/png" });
		fireEvent.change(screen.getByLabelText("Choose avatar image"), {
			target: { files: [file] },
		});

		expect(await screen.findByRole("dialog", { name: "Edit avatar" })).toBeInTheDocument();
		expect(screen.getByAltText("Selected avatar preview")).toHaveAttribute(
			"src",
			"blob:avatar-preview",
		);
		expect(screen.getByText("Drag to position")).toBeInTheDocument();
		expect(screen.getByLabelText("Zoom")).toHaveAttribute("type", "range");
		expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Zoom out" })).not.toBeInTheDocument();
	});

	it("opens the avatar editor after double clicking a saved avatar", async () => {
		render(
			<ProfileAvatarUploader
				value="profiles/an/avatar.jpg"
				name="An Nguyen"
				email="an@example.com"
				onChange={jest.fn()}
			/>,
		);

		fireEvent.doubleClick(screen.getByTitle("Edit current avatar"));

		expect(await screen.findByRole("dialog", { name: "Edit avatar" })).toBeInTheDocument();
		expect(screen.getByAltText("Selected avatar preview")).toHaveAttribute(
			"src",
			"/api/avatar-source?url=https%3A%2F%2Fandv-images.t3.storage.dev%2Fprofiles%2Fan%2Favatar.jpg",
		);
		expect(screen.getByText("Drag to position")).toBeInTheDocument();
	});

	it("does not open the editor after double clicking a fallback avatar", () => {
		render(
			<ProfileAvatarUploader
				value={null}
				name="An Nguyen"
				email="an@example.com"
				onChange={jest.fn()}
			/>,
		);

		fireEvent.doubleClick(screen.getByLabelText("Profile avatar"));

		expect(screen.queryByRole("dialog", { name: "Edit avatar" })).not.toBeInTheDocument();
	});

	it("uploads a recropped current avatar and updates the form value", async () => {
		const onChange = jest.fn();
		const croppedFile = new File(["cropped"], "current-avatar-cropped.jpg", {
			type: "image/jpeg",
		});
		jest.mocked(cropAvatarImage).mockResolvedValue(croppedFile);
		mockUploadMutateAsync.mockResolvedValue({
			key: "uploads/current-avatar-cropped.jpg",
		});

		render(
			<ProfileAvatarUploader
				value="profiles/an/avatar.jpg"
				name="An Nguyen"
				email="an@example.com"
				onChange={onChange}
			/>,
		);

		fireEvent.doubleClick(screen.getByTitle("Edit current avatar"));
		fireEvent.click(await screen.findByRole("button", { name: "Apply" }));

		await waitFor(() =>
			expect(onChange).toHaveBeenCalledWith("uploads/current-avatar-cropped.jpg"),
		);
		expect(cropAvatarImage).toHaveBeenCalledWith(
			expect.any(HTMLImageElement),
			expect.objectContaining({ outputSize: 320, sourceName: "current-avatar.jpg" }),
		);
		expect(mockUploadMutateAsync).toHaveBeenCalledWith({ file: croppedFile });
	});

	it("uploads the cropped avatar and updates the form value", async () => {
		const onChange = jest.fn();
		const croppedFile = new File(["cropped"], "avatar-cropped.jpg", { type: "image/jpeg" });
		jest.mocked(cropAvatarImage).mockResolvedValue(croppedFile);
		mockUploadMutateAsync.mockResolvedValue({
			key: "uploads/avatar-cropped.jpg",
		});

		render(
			<ProfileAvatarUploader
				value={null}
				name="An Nguyen"
				email="an@example.com"
				onChange={onChange}
			/>,
		);

		const file = new File(["avatar"], "avatar.png", { type: "image/png" });
		fireEvent.change(screen.getByLabelText("Choose avatar image"), {
			target: { files: [file] },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Apply" }));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("uploads/avatar-cropped.jpg"));
		expect(cropAvatarImage).toHaveBeenCalledWith(
			expect.any(HTMLImageElement),
			expect.objectContaining({ outputSize: 320 }),
		);
		expect(mockUploadMutateAsync).toHaveBeenCalledWith({ file: croppedFile });
	});
});
