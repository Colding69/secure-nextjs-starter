import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;
const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 5_000;

export type SafeFetchOptions = {
  allowlist: string[];
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
};

export type SafeFetchResult = {
  status: number;
  contentType: string | null;
  body: string;
  finalUrl: string;
};

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

export function isPrivateIp(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export function isHostnameAllowed(hostname: string, allowlist: string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return allowlist.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export async function assertSafeUrl(
  rawUrl: string,
  allowlist: string[],
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("Credentials in URLs are not allowed");
  }
  if (url.port && url.port !== "443") {
    throw new Error("Only the default HTTPS port is allowed");
  }
  if (allowlist.length === 0) {
    throw new Error("No outbound hosts are allowlisted");
  }
  if (!isHostnameAllowed(url.hostname, allowlist)) {
    throw new Error("Host is not in the allowlist");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) {
    throw new Error("Local hosts are not allowed");
  }

  if (net.isIP(url.hostname)) {
    if (isPrivateIp(url.hostname)) {
      throw new Error("Private IP addresses are not allowed");
    }
  } else {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.length === 0) {
      throw new Error("Host could not be resolved");
    }
    for (const entry of addresses) {
      if (isPrivateIp(entry.address)) {
        throw new Error("Host resolves to a private address");
      }
    }
  }

  return url;
}

export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions,
): Promise<SafeFetchResult> {
  const allowlist = options.allowlist;
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  let current = await assertSafeUrl(rawUrl, allowlist);

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept: "text/plain, text/html;q=0.8, application/json;q=0.7",
        "user-agent": "secure-nextjs-starter/0.1",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without a Location header");
      if (redirects === maxRedirects) throw new Error("Too many redirects");
      current = await assertSafeUrl(new URL(location, current).toString(), allowlist);
      continue;
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > maxBytes) {
      throw new Error("Response is too large");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error("Response is too large");
    }

    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: buffer.toString("utf8"),
      finalUrl: current.toString(),
    };
  }

  throw new Error("Too many redirects");
}
