import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth";
import {
	useRequestPasswordResetMutation,
	useResetPasswordMutation,
	useSignInEmailMutation,
	useSignUpEmailMutation,
	useSocialSignInMutation,
	useVerifyEmailOtpMutation,
	useVerifySignInOtpMutation,
} from "@/features/auth/hooks/use-auth-command-mutations";
import { api } from "@/lib/api";

jest.mock("@/features/auth", () => ({
	authClient: {
		signIn: {
			email: jest.fn(),
			emailOtp: jest.fn(),
			social: jest.fn(),
		},
		signUp: {
			email: jest.fn(),
		},
		emailOtp: {
			requestPasswordReset: jest.fn(),
			resetPassword: jest.fn(),
			sendVerificationOtp: jest.fn(),
			verifyEmail: jest.fn(),
		},
	},
}));

jest.mock("@/lib/api", () => ({
	api: {
		auth: {
			emailExists: jest.fn(),
		},
	},
}));

function wrapper({ children }: { children: ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("auth command mutations", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("signs in with email credentials", async () => {
		jest.mocked(authClient.signIn.email).mockResolvedValue({ error: null } as never);
		const { result } = renderHook(() => useSignInEmailMutation(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({
				email: "an@example.com",
				password: "password123",
				callbackURL: "/",
			});
		});

		expect(authClient.signIn.email).toHaveBeenCalledWith({
			email: "an@example.com",
			password: "password123",
			callbackURL: "/",
		});
	});

	it("signs up after checking email and sends verification OTP", async () => {
		jest.mocked(api.auth.emailExists).mockResolvedValue({ exists: false });
		jest.mocked(authClient.signUp.email).mockResolvedValue({ error: null } as never);
		jest
			.mocked(authClient.emailOtp.sendVerificationOtp)
			.mockResolvedValue({ error: null } as never);
		const { result } = renderHook(() => useSignUpEmailMutation(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({
				email: "AN@example.com",
				name: "An Nguyen",
				password: "password123",
			});
		});

		expect(api.auth.emailExists).toHaveBeenCalledWith("an@example.com");
		expect(authClient.signUp.email).toHaveBeenCalledWith({
			email: "an@example.com",
			password: "password123",
			name: "An Nguyen",
			callbackURL: "/",
		});
		expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
			email: "an@example.com",
			type: "email-verification",
		});
	});

	it("runs social sign-in and forgot/verify commands", async () => {
		jest.mocked(authClient.signIn.social).mockResolvedValue({ error: null } as never);
		jest
			.mocked(authClient.emailOtp.requestPasswordReset)
			.mockResolvedValue({ error: null } as never);
		jest.mocked(authClient.emailOtp.resetPassword).mockResolvedValue({ error: null } as never);
		jest.mocked(authClient.emailOtp.verifyEmail).mockResolvedValue({ error: null } as never);
		jest.mocked(authClient.signIn.emailOtp).mockResolvedValue({ error: null } as never);

		const social = renderHook(() => useSocialSignInMutation(), { wrapper });
		const requestReset = renderHook(() => useRequestPasswordResetMutation(), { wrapper });
		const resetPassword = renderHook(() => useResetPasswordMutation(), { wrapper });
		const verifyEmail = renderHook(() => useVerifyEmailOtpMutation(), { wrapper });
		const verifySignIn = renderHook(() => useVerifySignInOtpMutation(), { wrapper });

		await act(async () => {
			await social.result.current.mutateAsync({
				provider: "google",
				callbackURL: "https://app.test/vi",
			});
			await requestReset.result.current.mutateAsync({ email: "AN@example.com" });
			await resetPassword.result.current.mutateAsync({
				email: "AN@example.com",
				otp: "123456",
				password: "password123",
			});
			await verifyEmail.result.current.mutateAsync({ email: "an@example.com", otp: "123456" });
			await verifySignIn.result.current.mutateAsync({ email: "an@example.com", otp: "123456" });
		});

		expect(authClient.signIn.social).toHaveBeenCalledWith({
			provider: "google",
			callbackURL: "https://app.test/vi",
		});
		expect(authClient.emailOtp.requestPasswordReset).toHaveBeenCalledWith({
			email: "an@example.com",
		});
		expect(authClient.emailOtp.resetPassword).toHaveBeenCalledWith({
			email: "an@example.com",
			otp: "123456",
			password: "password123",
		});
		expect(authClient.emailOtp.verifyEmail).toHaveBeenCalledWith({
			email: "an@example.com",
			otp: "123456",
		});
		expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
			email: "an@example.com",
			otp: "123456",
		});
	});
});
