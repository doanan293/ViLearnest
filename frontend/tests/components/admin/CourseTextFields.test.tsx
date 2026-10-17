import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { CourseTextFields } from "@/components/admin/CourseTextFields";
import { Form } from "@/components/ui/form";
import type { CourseSchemaType } from "@/lib/zodSchemas";

jest.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string) => key,
}));

jest.mock("@/components/rich-text-editor/Editor", () => ({
	RichTextEditor: ({ field }: { field: { value: string; onChange: (value: string) => void } }) => (
		<textarea
			aria-label="description editor"
			value={field.value}
			onChange={(event) => field.onChange(event.target.value)}
		/>
	),
}));

function Harness({ onSubmit }: { onSubmit: (values: Partial<CourseSchemaType>) => void }) {
	const form = useForm<Partial<CourseSchemaType>>({
		defaultValues: {
			titleEn: "AI Fast",
			titleVi: "",
			smallDescriptionEn: "Learn fast",
			smallDescriptionVi: "",
			descriptionEn: "",
			descriptionVi: "",
			slug: "",
		},
	});
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<CourseTextFields form={form as never} />
				<button type="submit">save</button>
			</form>
		</Form>
	);
}

describe("CourseTextFields", () => {
	it("keeps the English text when only the Vietnamese tab is edited", async () => {
		const onSubmit = jest.fn();
		const user = userEvent.setup();
		render(<Harness onSubmit={onSubmit} />);

		await user.click(screen.getByRole("tab", { name: /VI/ }));
		await user.type(screen.getByPlaceholderText("courseTitle"), "AI Nhanh");
		await user.click(screen.getByRole("button", { name: "save" }));

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				titleEn: "AI Fast",
				titleVi: "AI Nhanh",
				smallDescriptionEn: "Learn fast",
			}),
			expect.anything(),
		);
	});

	it("generates the slug from the Vietnamese title when there is no English title", async () => {
		const user = userEvent.setup();
		render(<Harness onSubmit={jest.fn()} />);

		await user.clear(screen.getByPlaceholderText("courseTitle"));
		await user.click(screen.getByRole("tab", { name: /VI/ }));
		await user.type(screen.getByPlaceholderText("courseTitle"), "Khoa hoc AI");
		await user.click(screen.getByRole("button", { name: /generateSlug/ }));

		expect(screen.getByPlaceholderText("slug")).toHaveValue("Khoa-hoc-AI");
	});
});
