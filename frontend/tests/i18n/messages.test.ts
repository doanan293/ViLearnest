import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

function flattenKeys(value: unknown, prefix = ""): Array<string> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return [prefix];
	}

	return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
		flattenKeys(child, prefix ? `${prefix}.${key}` : key),
	);
}

describe("i18n messages", () => {
	it("keeps Vietnamese message keys in sync with English", () => {
		expect(flattenKeys(vi).sort()).toEqual(flattenKeys(en).sort());
	});
});
