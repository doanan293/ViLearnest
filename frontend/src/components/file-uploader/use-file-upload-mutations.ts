"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type FileUploadInput = {
	file: File;
	onProgress?: (progress: number) => void;
};

type FileUploadResult = {
	key: string;
};

function uploadWithProgress({
	file,
	onProgress,
	uploadUrl,
}: {
	file: File;
	onProgress: (progress: number) => void;
	uploadUrl: string;
}) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};

		xhr.onload = () => {
			if (xhr.status === 200 || xhr.status === 204) {
				resolve();
			} else {
				reject(new Error("Upload failed"));
			}
		};
		xhr.onerror = () => reject(new Error("Upload failed"));

		xhr.open("PUT", uploadUrl);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.send(file);
	});
}

export function useFileUploadMutation() {
	return useMutation<FileUploadResult, Error, FileUploadInput>({
		mutationFn: async ({ file, onProgress }) => {
			const { uploadUrl, key } = await api.s3.getPresignedUrl(file.name, file.type);

			if (onProgress) {
				await uploadWithProgress({ file, onProgress, uploadUrl });
				return { key };
			}

			const response = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			return { key };
		},
	});
}

export function useDeleteFileMutation() {
	return useMutation({
		mutationFn: (key: string) => api.s3.deleteFile(key),
	});
}
