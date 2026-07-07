"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
	useRequestPasswordResetMutation,
	useResetPasswordMutation,
} from "@/features/auth/hooks/use-auth-command-mutations";
import { Link, useRouter } from "@/i18n/navigation";
import {
	type ForgotPasswordRequestSchemaType,
	forgotPasswordRequestSchema,
	type ResetPasswordSchemaType,
	resetPasswordSchema,
} from "@/lib/zodSchemas";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const t = useTranslations("auth.forgotPassword");
	const tLogin = useTranslations("auth.login");
	const tErrors = useTranslations("errors");
	const tToasts = useTranslations("toasts");
	const [codeSent, setCodeSent] = useState(false);
	const requestResetMutation = useRequestPasswordResetMutation();
	const resetPasswordMutation = useResetPasswordMutation();
	const pending = requestResetMutation.isPending || resetPasswordMutation.isPending;

	const requestForm = useForm<ForgotPasswordRequestSchemaType>({
		resolver: zodResolver(forgotPasswordRequestSchema) as Resolver<ForgotPasswordRequestSchemaType>,
		defaultValues: { email: "" },
	});

	const resetForm = useForm<ResetPasswordSchemaType>({
		resolver: zodResolver(resetPasswordSchema) as Resolver<ResetPasswordSchemaType>,
		defaultValues: {
			email: "",
			otp: "",
			password: "",
			confirmPassword: "",
		},
	});

	function requestReset(data: ForgotPasswordRequestSchemaType) {
		requestResetMutation.mutate(
			{ email: data.email },
			{
				onSuccess: ({ email }) => {
					resetForm.setValue("email", email);
					setCodeSent(true);
					toast.success(tToasts("resetCodeSent"));
				},
				onError: (error) => {
					toast.error(error.message || tErrors("sendResetCodeFailed"));
				},
			},
		);
	}

	function resetPassword(data: ResetPasswordSchemaType) {
		resetPasswordMutation.mutate(
			{ email: data.email, otp: data.otp, password: data.password },
			{
				onSuccess: () => {
					toast.success(tToasts("passwordReset"));
					router.push("/login");
				},
				onError: (error) => {
					toast.error(error.message || tErrors("resetPasswordFailed"));
				},
			},
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto shadow-xl border-border bg-card/60 backdrop-blur-md">
			<CardHeader className="space-y-1 text-center">
				<CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
				<CardDescription>
					{codeSent ? t("resetDescription") : t("requestDescription")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{codeSent ? (
					<Form {...resetForm}>
						<form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-4">
							<FormField
								control={resetForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{tLogin("email")}</FormLabel>
										<FormControl>
											<div className="relative">
												<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input
													className="pl-10"
													type="email"
													autoComplete="email"
													disabled={pending}
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={resetForm.control}
								name="otp"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("verificationCode")}</FormLabel>
										<FormControl>
											<InputOTP
												value={field.value}
												onChange={field.onChange}
												maxLength={6}
												containerClassName="w-full gap-2"
												className="w-full"
											>
												<InputOTPGroup className="flex-1">
													<InputOTPSlot index={0} className="h-11 flex-1" />
													<InputOTPSlot index={1} className="h-11 flex-1" />
													<InputOTPSlot index={2} className="h-11 flex-1" />
												</InputOTPGroup>
												<InputOTPGroup className="flex-1">
													<InputOTPSlot index={3} className="h-11 flex-1" />
													<InputOTPSlot index={4} className="h-11 flex-1" />
													<InputOTPSlot index={5} className="h-11 flex-1" />
												</InputOTPGroup>
											</InputOTP>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={resetForm.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("newPassword")}</FormLabel>
										<FormControl>
											<div className="relative">
												<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input
													className="pl-10"
													type="password"
													autoComplete="new-password"
													disabled={pending}
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={resetForm.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{tLogin("confirmPassword")}</FormLabel>
										<FormControl>
											<div className="relative">
												<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input
													className="pl-10"
													type="password"
													autoComplete="new-password"
													disabled={pending}
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={pending}>
								{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("submitReset")}
							</Button>
						</form>
					</Form>
				) : (
					<Form {...requestForm}>
						<form onSubmit={requestForm.handleSubmit(requestReset)} className="space-y-4">
							<FormField
								control={requestForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{tLogin("email")}</FormLabel>
										<FormControl>
											<div className="relative">
												<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input
													className="pl-10"
													type="email"
													autoComplete="email"
													autoCapitalize="none"
													disabled={pending}
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={pending}>
								{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("submitRequest")}
							</Button>
						</form>
					</Form>
				)}
				<Button variant="link" className="w-full" asChild>
					<Link href="/login">{t("backToSignIn")}</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
