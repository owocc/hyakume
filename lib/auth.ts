import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  const root = globalThis as {
    __env__?: Record<string, string>;
    env?: Record<string, string>;
  };
  return root.__env__?.[key] || root.env?.[key];
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
    ...(getEnvVar("GITHUB_CLIENT_ID") && getEnvVar("GITHUB_CLIENT_SECRET")
      ? {
          github: {
            clientId: getEnvVar("GITHUB_CLIENT_ID")!,
            clientSecret: getEnvVar("GITHUB_CLIENT_SECRET")!,
          },
        }
      : {}),
    ...(getEnvVar("GOOGLE_CLIENT_ID") && getEnvVar("GOOGLE_CLIENT_SECRET")
      ? {
          google: {
            clientId: getEnvVar("GOOGLE_CLIENT_ID")!,
            clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET")!,
          },
        }
      : {}),
  },
  secret: getEnvVar("BETTER_AUTH_SECRET"),
  baseURL: getEnvVar("BETTER_AUTH_URL") || "https://hyakume.owocc.workers.dev",
});
