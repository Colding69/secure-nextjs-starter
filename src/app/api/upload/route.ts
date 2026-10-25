import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!can(role, "upload:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds the 5 MB limit" }, { status: 413 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validated = await validateUpload({
      name: file.name,
      size: file.size,
      declaredType: file.type || undefined,
      bytes,
    });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    await recordAudit({
      actorId: session.user.id,
      action: "upload.validated",
      target: file.name,
      ip,
      metadata: {
        mime: validated.mime,
        size: validated.size,
        storedAs: validated.safeName,
      },
    });

    return NextResponse.json({
      ok: true,
      storedAs: validated.safeName,
      mime: validated.mime,
      size: validated.size,
      note: "Validated only. This starter does not persist uploads.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
