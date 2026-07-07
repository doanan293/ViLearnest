/**
 * @jest-environment node
 */

import { renderToString } from "react-dom/server";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";

describe("RenderDescription", () => {
	it("renders TipTap JSON during server rendering without browser globals", () => {
		expect(() =>
			renderToString(
				<RenderDescription
					json={{
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [{ type: "text", text: "Server-safe description" }],
							},
						],
					}}
				/>,
			),
		).not.toThrow();
	});
});
