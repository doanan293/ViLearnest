import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const allowedAvatarHost = `${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev`;

export async function GET(request: Request) {
	const sourceUrl = new URL(request.url).searchParams.get("url");
	if (!sourceUrl) {
		return new NextResponse("Missing avatar URL", { status: 400 });
	}

	let source: URL;
	try {
		source = new URL(sourceUrl);
	} catch {
		return new NextResponse("Invalid avatar URL", { status: 400 });
	}

	if (source.protocol !== "https:" || source.hostname !== allowedAvatarHost) {
		return new NextResponse("Avatar URL is not allowed", { status: 400 });
	}

	const response = await fetch(source, { cache: "no-store" });
	if (!response.ok || !response.body) {
		return new NextResponse("Could not load avatar", { status: 502 });
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.startsWith("image/")) {
		return new NextResponse("Avatar URL did not return an image", { status: 502 });
	}

	return new NextResponse(response.body, {
		headers: {
			"Cache-Control": "private, max-age=300",
			"Content-Type": contentType,
		},
	});
}
