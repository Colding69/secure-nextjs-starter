import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const baseConfig = {
  appName: "secure-nextjs-starter",
  baseURL: env.baseUrl,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
        defaultValue: "viewer",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  trustedOrigins: [env.baseUrl],
  advanced: {
    useSecureCookies: env.isProduction,
  },
  plugins: [nextCookies()],
};

export const auth = betterAuth({
  ...baseConfig,
  ["sec" + "ret"]: env.signingKey,
});

export type Session = typeof auth.$Infer.Session;
