import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { can } from "@/lib/rbac";
import { safeFetch } from "@/lib/safe-fetch";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!can(role, "preview:fetch")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`preview:${session.user.id}:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  }

  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const result = await safeFetch(target, {
      allowlist: env.SAFE_FETCH_ALLOWLIST,
    });

    await recordAudit({
      actorId: session.user.id,
      action: "preview.fetch",
      target,
      ip,
      metadata: { status: result.status, finalUrl: result.finalUrl },
    });

    return NextResponse.json({
      status: result.status,
      contentType: result.contentType,
      body: result.body.slice(0, 20_000),
      truncated: result.body.length > 20_000,
      finalUrl: result.finalUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    await recordAudit({
      actorId: session.user.id,
      action: "preview.blocked",
      target,
      ip,
      metadata: { reason: message },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
