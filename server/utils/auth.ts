import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import Database from "better-sqlite3";

const hasGitHub =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  appName: "Nuxt Better Auth",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      skipVerificationOnEnable: true,
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log("[2FA OTP]", user.email, "→ Code:", otp);
        },
      },
    }),
  ],
  ...(hasGitHub && {
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
  }),
});
