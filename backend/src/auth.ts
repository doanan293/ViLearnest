import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { getAuthCookieOptions } from "./config/auth-cookie.js";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import { sendEmail } from "./utils/email.js";

export const auth = betterAuth({
  baseURL: process.env.API_BASE_URL || "http://localhost:5000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  cookie: getAuthCookieOptions(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async () => {
      // No-op: we will send OTP instead of link during sign-up
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID || "mock-google-id",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET || "mock-google-secret",
    },
    github: {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID || "mock-github-id",
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET || "mock-github-secret",
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["google", "github"],
    },
  },
  plugins: [
    admin(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const isPasswordReset = type === "forget-password";
        const subject = isPasswordReset ? "Reset your password - Andv LMS" : "Verification Code - Andv LMS";
        const heading = isPasswordReset ? "Reset your password" : "Verify your email address";
        const body = isPasswordReset
          ? "Please use the following verification code to reset your password:"
          : "Please use the following verification code to verify your email address and activate your account:";
        await sendEmail({
          to: email,
          subject,
          text: `Your verification code is: ${otp}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
              <h2>${heading}</h2>
              <p>${body}</p>
              <p style="margin: 24px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${otp}</p>
              <p style="color: #6b7280; font-size: 14px;">This code will expire shortly.</p>
            </div>
          `,
        });
      },
    }),
  ],
});
