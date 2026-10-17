"use client";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";

export function RichTextEditor({
	field,
}: {
	field: { value: string; onChange: (value: string) => void };
}) {
	const editor = useEditor({
		extensions: [StarterKit, TextAlign.configure({ types: ["heading", "paragraph"] })],
		immediatelyRender: false,

		editorProps: {
			attributes: {
				class:
					"min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
			},
		},

		// An empty editor saves "" so the page falls back to the other language.
		onUpdate: ({ editor }) => {
			field.onChange(editor.isEmpty ? "" : JSON.stringify(editor.getJSON()));
		},

		content: field.value ? JSON.parse(field.value) : "",
	});

	return (
		<div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
			<Menubar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}
