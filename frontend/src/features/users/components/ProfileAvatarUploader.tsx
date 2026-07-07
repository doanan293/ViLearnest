"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFileUploadMutation } from "@/components/file-uploader/use-file-upload-mutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cropAvatarImage } from "../utils/avatar-crop";
import { avatarSourceUrl, avatarUrl } from "../utils/avatar-url";

type Props = {
	value: string | null;
	name: string;
	email: string;
	onChange: (value: string | null) => void;
};

export function ProfileAvatarUploader({ value, name, email, onChange }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const [uploading, setUploading] = useState(false);
	const [editorSource, setEditorSource] = useState<{
		url: string;
		sourceName: string;
		revokeOnClose: boolean;
	} | null>(null);
	const [zoom, setZoom] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [dragStart, setDragStart] = useState<{
		x: number;
		y: number;
		offsetX: number;
		offsetY: number;
	} | null>(null);
	const { mutateAsync: uploadFile } = useFileUploadMutation();
	const imageUrl = avatarUrl(value, email);
	const fallback = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

	useEffect(() => {
		return () => {
			if (editorSource?.revokeOnClose) {
				URL.revokeObjectURL(editorSource.url);
			}
		};
	}, [editorSource]);

	function chooseFile(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Please choose an image file");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be 5MB or smaller");
			return;
		}

		if (editorSource?.revokeOnClose) {
			URL.revokeObjectURL(editorSource.url);
		}

		setEditorSource({
			url: URL.createObjectURL(file),
			sourceName: file.name,
			revokeOnClose: true,
		});
		setZoom(1);
		setOffset({ x: 0, y: 0 });
		setDragStart(null);
	}

	function editCurrentAvatar() {
		if (!value || uploading) return;

		if (editorSource?.revokeOnClose) {
			URL.revokeObjectURL(editorSource.url);
		}

		setEditorSource({
			url: avatarSourceUrl(imageUrl),
			sourceName: "current-avatar.jpg",
			revokeOnClose: false,
		});
		setZoom(1);
		setOffset({ x: 0, y: 0 });
		setDragStart(null);
	}

	function closeEditor() {
		if (editorSource?.revokeOnClose) {
			URL.revokeObjectURL(editorSource.url);
		}
		setEditorSource(null);
		setZoom(1);
		setOffset({ x: 0, y: 0 });
		setDragStart(null);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}

	function startDrag(event: PointerEvent<HTMLDivElement>) {
		event.currentTarget.setPointerCapture(event.pointerId);
		setDragStart({
			x: event.clientX,
			y: event.clientY,
			offsetX: offset.x,
			offsetY: offset.y,
		});
	}

	function dragImage(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart) return;
		setOffset({
			x: dragStart.offsetX + event.clientX - dragStart.x,
			y: dragStart.offsetY + event.clientY - dragStart.y,
		});
	}

	function endDrag() {
		setDragStart(null);
	}

	async function applyCrop() {
		if (!editorSource || !imageRef.current) return;

		setUploading(true);
		try {
			const croppedFile = await cropAvatarImage(imageRef.current, {
				outputSize: 320,
				zoom,
				offsetX: offset.x,
				offsetY: offset.y,
				sourceName: editorSource.sourceName,
			});
			const { key } = await uploadFile({ file: croppedFile });

			onChange(key);
			closeEditor();
			toast.success("Avatar uploaded");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Avatar upload failed");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="flex items-center gap-4">
			<button
				type="button"
				aria-label="Profile avatar"
				aria-disabled={!value || uploading}
				className={`rounded-lg bg-transparent p-0 text-left ${value ? "cursor-pointer" : "cursor-default"}`}
				onDoubleClick={editCurrentAvatar}
				title={value ? "Edit current avatar" : undefined}
			>
				<Avatar className="size-20 rounded-lg">
					<AvatarImage src={imageUrl} alt={name} />
					<AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
				</Avatar>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				aria-label="Choose avatar image"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) chooseFile(file);
				}}
			/>
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => inputRef.current?.click()}
					disabled={uploading}
				>
					{uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
					Upload
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => onChange(null)}
					disabled={uploading || !value}
					aria-label="Remove avatar"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
			<Dialog open={Boolean(editorSource)} onOpenChange={(open) => !open && closeEditor()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit avatar</DialogTitle>
						<DialogDescription>Drag to position</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div
							className="mx-auto size-64 cursor-grab touch-none overflow-hidden rounded-lg border bg-muted active:cursor-grabbing"
							onPointerDown={startDrag}
							onPointerMove={dragImage}
							onPointerUp={endDrag}
							onPointerCancel={endDrag}
							onPointerLeave={endDrag}
						>
							{editorSource && (
								<Image
									ref={imageRef}
									src={editorSource.url}
									alt="Selected avatar preview"
									width={256}
									height={256}
									unoptimized
									className="size-full select-none object-cover"
									draggable={false}
									style={{
										transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
									}}
								/>
							)}
						</div>
						<div className="space-y-2">
							<label htmlFor="avatar-zoom" className="text-muted-foreground text-sm">
								Zoom
							</label>
							<input
								id="avatar-zoom"
								type="range"
								min="1"
								max="3"
								step="0.05"
								value={zoom}
								onChange={(event) => setZoom(Number(event.target.value))}
								className="w-full accent-primary"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeEditor} disabled={uploading}>
							Cancel
						</Button>
						<Button type="button" onClick={applyCrop} disabled={uploading}>
							{uploading ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Uploading...
								</>
							) : (
								"Apply"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
