import { expect, signIn, test } from "./fixtures";

test("an unenrolled learner cannot read the protected lesson", async ({ page, lms }) => {
	await signIn(page.context(), lms.actors.learnerA);
	const response = await page.request.get(
		`http://localhost:5002/api/v1/courses/lessons/${lms.ids.unenrolledLesson}`,
	);
	expect(response.status()).toBe(403);
	await page.goto(`/vi/dashboard/${lms.ids.unenrolledSlug}/${lms.ids.unenrolledLesson}`);
	await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Unenrolled Lesson (vi)", exact: true }),
	).not.toBeVisible();
	await expect(
		page.getByRole("button", { name: "Đánh dấu hoàn thành", exact: true }),
	).not.toBeVisible();
});

test("completion persists after reload and stays isolated from another learner", async ({
	page,
	browser,
	lms,
}) => {
	await signIn(page.context(), lms.actors.learnerA);
	const lessonPath = `/vi/dashboard/${lms.ids.activeSlug}/${lms.ids.activeLesson}`;
	await page.goto(lessonPath);
	await expect(
		page.getByRole("heading", { name: "Active Lesson (vi)", exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "Đánh dấu hoàn thành", exact: true }).click();
	await expect(page.getByRole("button", { name: "Đã hoàn thành", exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("button", { name: "Đã hoàn thành", exact: true })).toBeVisible();
	const other = await browser.newContext({ baseURL: "http://localhost:3002", locale: "vi-VN" });
	try {
		await signIn(other, lms.actors.learnerB);
		const otherPage = await other.newPage();
		await otherPage.goto(lessonPath);
		await expect(
			otherPage.getByRole("button", { name: "Đánh dấu hoàn thành", exact: true }),
		).toBeVisible();
		await expect(
			otherPage.getByRole("button", { name: "Đã hoàn thành", exact: true }),
		).not.toBeVisible();
	} finally {
		await other.close();
	}
});

test("lesson titles follow the page locale", async ({ page, lms }) => {
	await signIn(page.context(), lms.actors.learnerA);
	await page.goto(`/en/dashboard/${lms.ids.activeSlug}/${lms.ids.activeLesson}`);
	await expect(page.getByRole("heading", { name: "Active Lesson", exact: true })).toBeVisible();
	await page.goto(`/vi/dashboard/${lms.ids.activeSlug}/${lms.ids.activeLesson}`);
	await expect(
		page.getByRole("heading", { name: "Active Lesson (vi)", exact: true }),
	).toBeVisible();
});
