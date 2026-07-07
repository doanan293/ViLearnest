"use client";
import { useCallback, useEffect, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import {
	RenderEmptyState,
	RenderErrorState,
	RenderUploadedState,
	RenderUploadingState,
} from "./RenderState";
import { useDeleteFileMutation, useFileUploadMutation } from "./use-file-upload-mutations";

interface UploaderState {
	id: string | null;
	file: File | null;
	uploading: boolean;
	progess: number;
	key?: string;
	isDeleting: boolean;
	error: boolean;
	objectUrl?: string;
	fileType: "image" | "video";
}

interface iAppProps {
	value?: string;
	onChange?: (value: string) => void;
	fileTypeAccepted: "image" | "video";
}

export function Uploader({ onChange, value, fileTypeAccepted }: iAppProps) {
	const fileUrl = useConstructUrl(value || "");
	const { mutateAsync: uploadFileMutation } = useFileUploadMutation();
	const { mutateAsync: deleteFileMutation } = useDeleteFileMutation();
	const [fileState, setFileState] = useState<UploaderState>({
		error: false,
		file: null,
		id: null,
		uploading: false,
		progess: 0,
		isDeleting: false,
		fileType: fileTypeAccepted,
		key: value,
		objectUrl: value ? fileUrl : undefined,
	});

	const uploadFile = useCallback(
		async (file: File) => {
			setFileState((prev) => ({ ...prev, uploading: true, progess: 0 }));
			try {
				const { key } = await uploadFileMutation({
					file,
					onProgress: (progress) => {
						setFileState((prev) => ({
							...prev,
							progess: progress,
						}));
					},
				});

				setFileState((prev) => ({
					...prev,
					uploading: false,
					progess: 100,
					key: key,
				}));

				onChange?.(key);

				toast.success("File uploaded successfully");
			} catch {
				toast.error("Something went wrong");
				setFileState((prev) => ({
					...prev,
					progess: 0,
					error: true,
					uploading: false,
				}));
			}
		},
		[onChange, uploadFileMutation],
	);

	const onDrop = useCallback(
		(acceptedFiles: Array<File>) => {
			if (acceptedFiles.length > 0) {
				const file = acceptedFiles[0];
				if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
					URL.revokeObjectURL(fileState.objectUrl);
				}
				setFileState({
					file: file,
					uploading: false,
					progess: 0,
					objectUrl: URL.createObjectURL(file),
					error: false,
					id: uuidv4(),
					isDeleting: false,
					fileType: fileTypeAccepted,
				});

				uploadFile(file);
			}
		},
		[fileState.objectUrl, uploadFile, fileTypeAccepted],
	);

	async function handleRemoveFile() {
		if (fileState.isDeleting || !fileState.objectUrl || !fileState.key) return;
		try {
			setFileState((prev) => ({
				...prev,
				isDeleting: true,
			}));

			await deleteFileMutation(fileState.key);

			if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
				URL.revokeObjectURL(fileState.objectUrl);
			}

			onChange?.("");

			setFileState(() => ({
				file: null,
				uploading: false,
				progess: 0,
				objectUrl: undefined,
				error: false,
				fileType: fileTypeAccepted,
				id: null,
				isDeleting: false,
			}));
			toast.success("File removed successfully");
		} catch {
			toast.error("Error removing file. Please try again");
			setFileState((prev) => ({
				...prev,
				isDeleting: false,
				error: true,
			}));
		}
	}

	function rejectedFiles(fileRejection: Array<FileRejection>) {
		if (fileRejection.length) {
			const tooManyFiles = fileRejection.find(
				(rejection) => rejection.errors[0].code === "too-many-files",
			);

			const fileSizeToBig = fileRejection.find(
				(rejection) => rejection.errors[0].code === "file-too-large",
			);

			if (fileSizeToBig) {
				toast.error("File is too large, max size is 5MB");
			}

			if (tooManyFiles) {
				toast.error("Too many files selected, max is 1");
			}
		}
	}

	function renderContent() {
		if (fileState.uploading) {
			return <RenderUploadingState file={fileState.file as File} progress={fileState.progess} />;
		}

		if (fileState.error) {
			return <RenderErrorState />;
		}

		if (fileState.objectUrl) {
			return (
				<RenderUploadedState
					handleRemoveFile={handleRemoveFile}
					previewUrl={fileState.objectUrl}
					isDeleting={fileState.isDeleting}
					fileType={fileState.fileType}
				/>
			);
		}

		return <RenderEmptyState isDragActive={false} />;
	}

	useEffect(() => {
		return () => {
			if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
				URL.revokeObjectURL(fileState.objectUrl);
			}
		};
	}, [fileState.objectUrl]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: fileTypeAccepted === "video" ? { "video/*": [] } : { "image/*": [] },
		maxFiles: 1,
		multiple: false,
		maxSize: fileTypeAccepted === "image" ? 5 * 1024 * 1024 : 5000 * 1024 * 1024,
		onDropRejected: rejectedFiles,
		disabled: fileState.uploading || !!fileState.objectUrl,
	});
	return (
		<Card
			{...getRootProps()}
			className={cn(
				"relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
				isDragActive
					? "border-primary bg-primary/10 border-solid"
					: "border-border hover:border-primary",
			)}
		>
			<CardContent className="flex items-center justify-center h-full w-full p-4">
				<input {...getInputProps()} />
				{renderContent()}
			</CardContent>
		</Card>
	);
}
