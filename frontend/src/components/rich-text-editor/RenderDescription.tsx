"use client";
import TextAlign from "@tiptap/extension-text-align";
import { generateHTML, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import parse from "html-react-parser";
import { useEffect, useState } from "react";

// json is null when the description is empty in both languages.
export function RenderDescription({ json }: { json: JSONContent | null }) {
	const [output, setOutput] = useState<string | null>(null);

	useEffect(() => {
		if (!json) {
			setOutput(null);
			return;
		}
		setOutput(
			generateHTML(json, [StarterKit, TextAlign.configure({ types: ["heading", "paragraph"] })]),
		);
	}, [json]);

	if (!json) {
		return null;
	}

	return (
		<div className="prose dark:prose-invert prose-li:marker:text-primary">
			{output ? parse(output) : null}
		</div>
	);
}
