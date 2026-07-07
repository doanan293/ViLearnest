import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("auth command mutation boundaries", () => {
	it("keeps auth commands behind mutation hooks", () => {
		const hookSource = readFileSync(
			join(root, "src/features/auth/hooks/use-auth-command-mutations.ts"),
			"utf8",
		);
		const loginSource = readFileSync(
			join(root, "src/app/[locale]/(auth)/login/_components/LoginForm.tsx"),
			"utf8",
		);
		const forgotSource = readFileSync(
			join(root, "src/app/[locale]/(auth)/forgot-password/page.tsx"),
			"utf8",
		);
		const verifySource = readFileSync(
			join(root, "src/app/[locale]/(auth)/verify-request/page.tsx"),
			"utf8",
		);

		expect(hookSource).toContain("useMutation");
		expect(hookSource).toContain("authClient.signIn.email");
		expect(hookSource).toContain("authClient.signUp.email");
		expect(hookSource).toContain("authClient.emailOtp.requestPasswordReset");
		expect(hookSource).toContain("authClient.emailOtp.verifyEmail");
		expect(loginSource).toContain("useSignInEmailMutation");
		expect(loginSource).toContain("useSignUpEmailMutation");
		expect(loginSource).not.toContain("useTransition");
		expect(loginSource).not.toContain("api.auth.emailExists");
		expect(forgotSource).toContain("useRequestPasswordResetMutation");
		expect(forgotSource).toContain("useResetPasswordMutation");
		expect(forgotSource).not.toContain("useTransition");
		expect(verifySource).toContain("useVerifyEmailOtpMutation");
		expect(verifySource).toContain("useVerifySignInOtpMutation");
		expect(verifySource).not.toContain("useTransition");
	});
});
