import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("upload lifecycle boundary", () => {
	it("keeps direct storage API calls inside shared mutation hooks", () => {
		const hookSource = readFileSync(
			join(root, "src/components/file-uploader/use-file-upload-mutations.ts"),
			"utf8",
		);
		const uploaderSource = readFileSync(
			join(root, "src/components/file-uploader/Uploader.tsx"),
			"utf8",
		);
		const avatarSource = readFileSync(
			join(root, "src/features/users/components/ProfileAvatarUploader.tsx"),
			"utf8",
		);

		expect(hookSource).toContain("api.s3.getPresignedUrl");
		expect(hookSource).toContain("api.s3.deleteFile");
		expect(uploaderSource).toContain("useFileUploadMutation");
		expect(uploaderSource).toContain("useDeleteFileMutation");
		expect(uploaderSource).not.toContain("api.s3.");
		expect(avatarSource).toContain("useFileUploadMutation");
		expect(avatarSource).not.toContain("api.s3.");
	});
});
