import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function roleOf(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}
