import Link from "next/link";
import { getSession } from "@/lib/session";

const controls = [
  ["Authentication", "Better Auth with email + password, 12-char minimum, session rotation and secure cookies."],
  ["Authorization", "Typed RBAC policy with a tested route × role × anonymous matrix."],
  ["Strict CSP", "Per-request nonce, strict-dynamic, no unsafe-inline scripts."],
  ["SSRF-safe fetch", "HTTPS-only, host allowlist, private-IP blocking and redirect re-validation."],
  ["Rate limiting", "Per-user and per-IP limits on sensitive endpoints."],
  ["Audit logging", "Append-only events with automatic email and token redaction."],
  ["Upload validation", "Magic-byte detection, extension match, 5 MB cap and random names."],
  ["CI security gate", "Semgrep, CodeQL, Gitleaks, Trivy, OSV and SBOM workflows."],
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            AppSec starter
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Secure by default.
            <br />
            Not by checklist.
          </h1>
          <p className="mt-5 text-zinc-400">
            A Next.js 16 starter that ships authentication, RBAC, strict CSP,
            SSRF-safe fetching, rate limiting, audit logs and a real security
            CI gate. Every control has a test. Mapped to OWASP ASVS 5.0 L2.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-emerald-500 px-5 py-2.5 text-center text-sm font-semibold text-emerald-950"
            >
              Open dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-emerald-500 px-5 py-2.5 text-center text-sm font-semibold text-emerald-950"
            >
              Sign in to the demo
            </Link>
          )}
          <a
            href="https://github.com/Colding69/secure-nextjs-starter"
            className="rounded-md border border-zinc-700 px-5 py-2.5 text-center text-sm text-zinc-300 hover:border-zinc-500"
          >
            View source
          </a>
        </div>
      </div>

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        {controls.map(([title, description]) => (
          <article
            key={title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="font-semibold">Run it locally</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-300">
{`pnpm install
pnpm db:seed
pnpm dev`}
        </pre>
        <p className="mt-3 text-sm text-zinc-400">
          Run pnpm db:seed to create demo accounts; the ASVS mapping is in docs/.
          This is a starter, not a certified product: review the threat model
          and adapt it to your deployment.
        </p>
      </section>

      <footer className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        MIT licensed. No telemetry. Security policy in SECURITY.md.
      </footer>
    </main>
  );
}
