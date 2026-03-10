import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const hasGitHub =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  ...(hasGitHub && {
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
  }),
});
