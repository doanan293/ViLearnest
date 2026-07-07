import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/features/auth";
import { api } from "@/lib/api";

type SocialProvider = "google" | "github";
type AuthError = { code?: string; message?: string };
type AuthResult = { error?: AuthError | null };

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function assertNoAuthError(result: AuthResult, fallbackMessage: string) {
	if (result.error) {
		throw Object.assign(new Error(result.error.message || fallbackMessage), {
			code: result.error.code,
		});
	}
	return result;
}

export function useSocialSignInMutation() {
	return useMutation({
		mutationFn: async ({
			callbackURL,
			provider,
		}: {
			callbackURL: string;
			provider: SocialProvider;
		}) => {
			const result = (await authClient.signIn.social({ provider, callbackURL })) as AuthResult;
			return assertNoAuthError(result, "Social sign-in failed");
		},
	});
}

export function useSignInEmailMutation() {
	return useMutation({
		mutationFn: async ({
			callbackURL,
			email,
			password,
		}: {
			callbackURL: string;
			email: string;
			password: string;
		}) => {
			const result = (await authClient.signIn.email({
				email,
				password,
				callbackURL,
			})) as AuthResult;
			return assertNoAuthError(result, "Sign-in failed");
		},
	});
}

export function useSignUpEmailMutation() {
	return useMutation({
		mutationFn: async ({
			email,
			name,
			password,
		}: {
			email: string;
			name: string;
			password: string;
		}) => {
			const normalizedEmail = normalizeEmail(email);
			const { exists } = await api.auth.emailExists(normalizedEmail);
			if (exists) {
				throw Object.assign(new Error("emailAlreadyExists"), { code: "EMAIL_EXISTS" });
			}

			const result = (await authClient.signUp.email({
				email: normalizedEmail,
				password,
				name,
				callbackURL: "/",
			})) as AuthResult;
			assertNoAuthError(result, "Create account failed");

			const otpResult = (await authClient.emailOtp.sendVerificationOtp({
				email: normalizedEmail,
				type: "email-verification",
			})) as AuthResult;
			assertNoAuthError(otpResult, "Send verification code failed");

			return { email: normalizedEmail };
		},
	});
}

export function useRequestPasswordResetMutation() {
	return useMutation({
		mutationFn: async ({ email }: { email: string }) => {
			const normalizedEmail = normalizeEmail(email);
			const result = (await authClient.emailOtp.requestPasswordReset({
				email: normalizedEmail,
			})) as AuthResult;
			assertNoAuthError(result, "Send reset code failed");
			return { email: normalizedEmail };
		},
	});
}

export function useResetPasswordMutation() {
	return useMutation({
		mutationFn: async ({
			email,
			otp,
			password,
		}: {
			email: string;
			otp: string;
			password: string;
		}) => {
			const result = (await authClient.emailOtp.resetPassword({
				email: normalizeEmail(email),
				otp,
				password,
			})) as AuthResult;
			return assertNoAuthError(result, "Reset password failed");
		},
	});
}

export function useVerifyEmailOtpMutation() {
	return useMutation({
		mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
			const result = (await authClient.emailOtp.verifyEmail({
				email,
				otp,
			})) as AuthResult;
			return assertNoAuthError(result, "Verify email failed");
		},
	});
}

export function useVerifySignInOtpMutation() {
	return useMutation({
		mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
			const result = (await authClient.signIn.emailOtp({
				email,
				otp,
			})) as AuthResult;
			return assertNoAuthError(result, "Verify sign-in code failed");
		},
	});
}
