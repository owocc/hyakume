import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

function getAuthSecret(): string | undefined {
  if (typeof process !== "undefined" && process.env?.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET;
  }
  const root = globalThis as {
    __env__?: Record<string, string>;
    env?: Record<string, string>;
  };
  return root.__env__?.BETTER_AUTH_SECRET || root.env?.BETTER_AUTH_SECRET;
}

function getAuthUrl(): string {
  if (typeof process !== "undefined" && process.env?.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  const root = globalThis as {
    __env__?: Record<string, string>;
    env?: Record<string, string>;
  };
  return (
    root.__env__?.BETTER_AUTH_URL ||
    root.env?.BETTER_AUTH_URL ||
    "https://hyakume.owocc.workers.dev"
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  secret: getAuthSecret(),
  baseURL: getAuthUrl(),
});

export default auth;
