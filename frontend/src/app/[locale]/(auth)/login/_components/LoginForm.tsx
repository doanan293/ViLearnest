"use client";
import { IconBrandGoogle } from "@tabler/icons-react";
import { GithubIcon, Loader2, Lock, Mail, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthCallbackURL } from "@/features/auth";
import {
	useSignInEmailMutation,
	useSignUpEmailMutation,
	useSocialSignInMutation,
} from "@/features/auth/hooks/use-auth-command-mutations";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/pathname";

export function LoginForm() {
	const router = useRouter();
	const locale = useLocale() as Locale;
	const t = useTranslations("auth.login");
	const tErrors = useTranslations("errors");
	const tToasts = useTranslations("toasts");

	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab");

	const [activeTab, setActiveTab] = useState<"signin" | "signup">(
		tabParam === "signup" ? "signup" : "signin",
	);

	useEffect(() => {
		if (tabParam === "signup" || tabParam === "signin") {
			setActiveTab(tabParam);
		}
	}, [tabParam]);
	const socialSignIn = useSocialSignInMutation();
	const signInEmailMutation = useSignInEmailMutation();
	const signUpEmailMutation = useSignUpEmailMutation();
	const googlePending = socialSignIn.isPending;
	const githubPending = socialSignIn.isPending;

	// Sign In States
	const [signInEmail, setSignInEmail] = useState("");
	const [signInPassword, setSignInPassword] = useState("");
	const signInPending = signInEmailMutation.isPending;

	// Sign Up States
	const [signUpName, setSignUpName] = useState("");
	const [signUpEmail, setSignUpEmail] = useState("");
	const [signUpPassword, setSignUpPassword] = useState("");
	const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
	const signUpPending = signUpEmailMutation.isPending;

	function signInWithGoogle() {
		socialSignIn.mutate(
			{
				provider: "google",
				callbackURL: getAuthCallbackURL(window.location.origin, locale),
			},
			{
				onSuccess: () => {
					toast.success(tToasts("googleSignedIn"));
				},
				onError: () => {
					toast.error(tErrors("internalServer"));
				},
			},
		);
	}

	function signInWithGithub() {
		socialSignIn.mutate(
			{
				provider: "github",
				callbackURL: getAuthCallbackURL(window.location.origin, locale),
			},
			{
				onSuccess: () => {
					toast.success(tToasts("githubSignedIn"));
				},
				onError: () => {
					toast.error(tErrors("internalServer"));
				},
			},
		);
	}

	function handleSignIn(e: React.FormEvent) {
		e.preventDefault();
		if (!signInEmail || !signInPassword) {
			toast.error(tErrors("fillAllFields"));
			return;
		}

		signInEmailMutation.mutate(
			{
				email: signInEmail,
				password: signInPassword,
				callbackURL: "/",
			},
			{
				onSuccess: () => {
					toast.success(tToasts("signedIn"));
					router.replace("/");
				},
				onError: (error) => {
					if ("code" in error && error.code === "EMAIL_NOT_VERIFIED") {
						toast.error(tErrors("emailNotVerified"));
					} else {
						toast.error(error.message || tErrors("invalidEmailOrPassword"));
					}
				},
			},
		);
	}

	function handleSignUp(e: React.FormEvent) {
		e.preventDefault();
		if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
			toast.error(tErrors("fillAllFields"));
			return;
		}

		if (signUpPassword !== signUpConfirmPassword) {
			toast.error(tErrors("passwordsDoNotMatch"));
			return;
		}

		if (signUpPassword.length < 8) {
			toast.error(tErrors("passwordTooShort"));
			return;
		}

		signUpEmailMutation.mutate(
			{ email: signUpEmail, password: signUpPassword, name: signUpName },
			{
				onSuccess: ({ email }) => {
					toast.success(tToasts("accountCreated"));
					router.push({
						pathname: "/verify-request",
						query: { email, type: "signup" },
					});
				},
				onError: (error) => {
					if ("code" in error && error.code === "EMAIL_EXISTS") {
						toast.error(tErrors("emailAlreadyExists"));
					} else {
						toast.error(error.message || tErrors("createAccountFailed"));
					}
				},
			},
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto shadow-xl border-border bg-card/60 backdrop-blur-md">
			<CardHeader className="space-y-1 text-center">
				<CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<Tabs
					value={activeTab}
					onValueChange={(val) => {
						const tab = val as "signin" | "signup";
						setActiveTab(tab);
						if (tab === "signup") {
							router.replace("/login?tab=signup");
						} else {
							router.replace("/login");
						}
					}}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2 mb-4">
						<TabsTrigger value="signin">{t("signIn")}</TabsTrigger>
						<TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
					</TabsList>

					<TabsContent value="signin">
						<form onSubmit={handleSignIn} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="signin-email">{t("email")}</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signin-email"
										placeholder="name@example.com"
										type="email"
										autoCapitalize="none"
										autoComplete="email"
										autoCorrect="off"
										className="pl-10"
										value={signInEmail}
										onChange={(e) => setSignInEmail(e.target.value)}
										disabled={signInPending}
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<Label htmlFor="signin-password">{t("password")}</Label>
									<Link href="/forgot-password" className="text-sm text-primary hover:underline">
										{t("forgotPassword")}
									</Link>
								</div>
								<div className="relative">
									<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signin-password"
										type="password"
										className="pl-10"
										value={signInPassword}
										onChange={(e) => setSignInPassword(e.target.value)}
										disabled={signInPending}
										required
									/>
								</div>
							</div>
							<Button className="w-full mt-2" type="submit" disabled={signInPending}>
								{signInPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{t("signingIn")}
									</>
								) : (
									t("signIn")
								)}
							</Button>
						</form>
					</TabsContent>

					<TabsContent value="signup">
						<form onSubmit={handleSignUp} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="signup-name">{t("fullName")}</Label>
								<div className="relative">
									<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-name"
										placeholder={t("fullNamePlaceholder")}
										type="text"
										className="pl-10"
										value={signUpName}
										onChange={(e) => setSignUpName(e.target.value)}
										disabled={signUpPending}
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-email">{t("email")}</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-email"
										placeholder="name@example.com"
										type="email"
										autoCapitalize="none"
										autoComplete="email"
										className="pl-10"
										value={signUpEmail}
										onChange={(e) => setSignUpEmail(e.target.value)}
										disabled={signUpPending}
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-password">{t("password")}</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-password"
										type="password"
										placeholder="••••••••"
										className="pl-10"
										value={signUpPassword}
										onChange={(e) => setSignUpPassword(e.target.value)}
										disabled={signUpPending}
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-confirm-password">{t("confirmPassword")}</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-confirm-password"
										type="password"
										placeholder="••••••••"
										className="pl-10"
										value={signUpConfirmPassword}
										onChange={(e) => setSignUpConfirmPassword(e.target.value)}
										disabled={signUpPending}
										required
									/>
								</div>
							</div>
							<Button className="w-full mt-2" type="submit" disabled={signUpPending}>
								{signUpPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{t("registering")}
									</>
								) : (
									t("createAccount")
								)}
							</Button>
						</form>
					</TabsContent>
				</Tabs>

				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-border" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
					</div>
				</div>

				<div className="space-y-2">
					<Button
						variant="outline"
						type="button"
						className="w-full"
						onClick={signInWithGoogle}
						disabled={googlePending}
					>
						{googlePending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<IconBrandGoogle className="mr-2 h-4 w-4" />
						)}
						{t("google")}
					</Button>

					<Button
						variant="outline"
						type="button"
						className="w-full"
						onClick={signInWithGithub}
						disabled={githubPending}
					>
						{githubPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<GithubIcon className="mr-2 h-4 w-4" />
						)}
						{t("github")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
