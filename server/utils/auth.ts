import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { LibsqlDialect } from "@libsql/kysely-libsql";

const hasGitHub =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: {
    dialect: new LibsqlDialect({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_TOKEN,
    }),
    type: "sqlite",
  },
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
