"use client";
import TextAlign from "@tiptap/extension-text-align";
import { generateHTML, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import parse from "html-react-parser";
import { useEffect, useState } from "react";

export function RenderDescription({ json }: { json: JSONContent }) {
	const [output, setOutput] = useState<string | null>(null);

	useEffect(() => {
		setOutput(
			generateHTML(json, [StarterKit, TextAlign.configure({ types: ["heading", "paragraph"] })]),
		);
	}, [json]);

	return (
		<div className="prose dark:prose-invert prose-li:marker:text-primary">
			{output ? parse(output) : null}
		</div>
	);
}
