"use client";

import { useState } from "react";

type PreviewResponse = {
  status?: number;
  contentType?: string | null;
  body?: string;
  truncated?: boolean;
  finalUrl?: string;
  error?: string;
};

export function PreviewForm() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch(
        `/api/preview?url=${encodeURIComponent(url)}`,
        { headers: { accept: "application/json" } },
      );
      setResult((await response.json()) as PreviewResponse);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold">SSRF-safe fetch demo</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Only HTTPS, allowlisted hosts, no private IPs, no credentials, no
        redirects outside the allowlist, 5s timeout and 1 MB cap.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          aria-label="URL to fetch"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
        >
          {pending ? "Fetching…" : "Fetch"}
        </button>
      </form>
      {result ? (
        <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
