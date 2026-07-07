import { getLocaleFromPathname, hasLocalePrefix, stripLocaleFromPathname } from "@/i18n/pathname";

describe("i18n pathname helpers", () => {
	it.each([
		["/en", true],
		["/en/courses", true],
		["/vi/admin/courses", true],
		["/courses", false],
		["/english", false],
		["/", false],
	])("detects locale prefix in %s", (pathname, expected) => {
		expect(hasLocalePrefix(pathname)).toBe(expected);
	});

	it.each([
		["/en", "/"],
		["/en/", "/"],
		["/en/courses", "/courses"],
		["/vi/admin/courses", "/admin/courses"],
		["/courses", "/courses"],
		["/", "/"],
	])("strips locale prefix from %s", (pathname, expected) => {
		expect(stripLocaleFromPathname(pathname)).toBe(expected);
	});

	it.each([
		["/en/courses", "en"],
		["/vi/login", "vi"],
		["/courses", undefined],
	])("reads locale from %s", (pathname, expected) => {
		expect(getLocaleFromPathname(pathname)).toBe(expected);
	});
});
