import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { can, isRole } from "@/lib/rbac";
import { getSession, roleOf } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentRole = roleOf(session.user);
  const role = isRole(currentRole) ? currentRole : "viewer";

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="font-semibold text-zinc-100">
              secure-nextjs-starter
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-200">
              Dashboard
            </Link>
            {can(role, "admin:read") ? (
              <Link href="/admin" className="text-zinc-400 hover:text-zinc-200">
                Admin
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-400 sm:inline">
              {session.user.email} · <strong className="text-zinc-200">{role}</strong>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
