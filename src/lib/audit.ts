import { auditLog } from "@/db/schema";
import { db } from "@/db";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN_PATTERN = /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|bearer\s+[A-Za-z0-9._-]{20,})\b/gi;

export function redact(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[email]")
    .replace(TOKEN_PATTERN, "[token]");
}

export type AuditEvent = {
  actorId?: string | null;
  action: string;
  target?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: event.actorId ?? null,
      action: event.action,
      target: event.target ? redact(event.target) : null,
      ip: event.ip ?? null,
      metadata: event.metadata
        ? redact(JSON.stringify(event.metadata))
        : null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("audit_log_write_failed", {
      action: event.action,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
