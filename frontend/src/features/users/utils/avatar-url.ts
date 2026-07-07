import { env } from "@/lib/env";

export function avatarUrl(image: string | null | undefined, email: string | null | undefined) {
	if (image && /^https?:\/\//i.test(image)) {
		return image;
	}

	if (image) {
		return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${image}`;
	}

	return `https://avatar.vercel.sh/${email ?? "user"}`;
}

export function avatarSourceUrl(imageUrl: string) {
	return `/api/avatar-source?url=${encodeURIComponent(imageUrl)}`;
}
