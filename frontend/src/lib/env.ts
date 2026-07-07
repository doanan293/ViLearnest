import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { arcjetModeSchema } from "./env-schema";

export const env = createEnv({
	server: {
		ARCJET_KEY: z.string().min(1),
		ARCJET_MODE: arcjetModeSchema,
	},

	client: {
		NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
	},
	// For Next.js >= 13.4.4, you only need to destructure client variables:
	experimental__runtimeEnv: {
		NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
	},
});
