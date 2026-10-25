"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { isRole, can } from "@/lib/rbac";
import { getSession, roleOf } from "@/lib/session";

export async function updateRole(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!can(roleOf(session.user), "users:role")) {
    redirect("/dashboard");
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !isRole(role)) {
    redirect("/admin?error=invalid");
  }
  if (userId === session.user.id) {
    redirect("/admin?error=self");
  }

  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));

  await recordAudit({
    actorId: session.user.id,
    action: "users.role_changed",
    target: userId,
    metadata: { role },
  });

  revalidatePath("/admin");
  redirect("/admin?ok=1");
}
