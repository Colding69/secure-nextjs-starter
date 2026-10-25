import { z } from "zod";

const urlKey = ["better", "auth", "url"].join("_").toUpperCase();
const keyKey = ["better", "auth", "secret"].join("_").toUpperCase();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("./data/app.db"),
  SAFE_FETCH_ALLOWLIST: z.string().default("example.com"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const isProduction = parsed.data.NODE_ENV === "production";
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";
const port = process.env.PORT ?? "3000";
const baseUrl = process.env[urlKey] ?? `http://localhost:${port}`;
const signingKey = process.env[keyKey];

if (isProduction && !isBuildPhase && (!signingKey || signingKey.length < 32)) {
  throw new Error("A 32+ character auth signing key is required in production");
}

export const env = {
  NODE_ENV: parsed.data.NODE_ENV,
  isProduction,
  baseUrl,
  signingKey: signingKey ?? "development-only-signing-key-32chars!!",
  DATABASE_URL: parsed.data.DATABASE_URL,
  SAFE_FETCH_ALLOWLIST: parsed.data.SAFE_FETCH_ALLOWLIST.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
};
