import { expect, test } from "./fixtures";

test("email login keeps the learner session after reloading the dashboard", async ({
	page,
	lms,
}) => {
	await page.goto("/vi/login");
	await page.getByLabel("Email", { exact: true }).fill(lms.actors.learnerA.email);
	await page.getByLabel("Mật khẩu", { exact: true }).fill(lms.actors.learnerA.password);
	await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
	await expect(page).toHaveURL(/\/vi$/);
	await page.goto("/vi/dashboard");
	await page.reload();
	await expect(page).toHaveURL(/\/vi\/dashboard/);
	const response = await page.request.get("http://localhost:5002/api/v1/auth/session");
	expect(response.status()).toBe(200);
	expect((await response.json()).user.id).toBe(lms.actors.learnerA.id);
});
