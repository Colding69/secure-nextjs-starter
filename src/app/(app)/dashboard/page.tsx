import { can, isRole } from "@/lib/rbac";
import { getSession, roleOf } from "@/lib/session";
import { PreviewForm } from "./preview-form";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  const currentRole = roleOf(session?.user);
  const role = isRole(currentRole) ? currentRole : "viewer";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Signed in as {session?.user.email} with role{" "}
          <span className="font-mono text-emerald-400">{role}</span>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="font-semibold">Active controls</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>✓ Strict nonce-based CSP</li>
            <li>✓ Security headers + HSTS</li>
            <li>✓ Session cookie auth with Better Auth</li>
            <li>✓ Role-based access control</li>
            <li>✓ Rate limiting on outbound fetches</li>
            <li>✓ Append-only audit log</li>
          </ul>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="font-semibold">Your permissions</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>{can(role, "dashboard:read") ? "✓" : "✗"} dashboard:read</li>
            <li>{can(role, "preview:fetch") ? "✓" : "✗"} preview:fetch</li>
            <li>{can(role, "upload:create") ? "✓" : "✗"} upload:create</li>
            <li>{can(role, "admin:read") ? "✓" : "✗"} admin:read</li>
            <li>{can(role, "users:role") ? "✓" : "✗"} users:role</li>
          </ul>
        </article>
      </section>

      {can(role, "preview:fetch") ? (
        <PreviewForm />
      ) : (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-400">
          Your role cannot use the SSRF-safe fetch demo. Sign in as editor or
          admin.
        </p>
      )}
    </div>
  );
}
