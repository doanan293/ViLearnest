import { env } from "@/lib/env";

export function useConstructUrl(key: string) {
	if (/^https?:\/\//i.test(key)) {
		return key;
	}

	return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key}`;
}
