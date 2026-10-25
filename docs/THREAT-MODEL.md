# Threat model

Last reviewed: 2026-10-25

## 1. System

A Next.js 16 application with:

- email/password authentication managed by Better Auth,
- session cookies,
- role-based access control (viewer, editor, admin),
- a server-side outbound fetch demo,
- upload validation,
- an append-only audit log,
- SQLite for local development.

## 2. Assets

| Asset | Why it matters |
| --- | --- |
| User accounts and sessions | Account takeover, privilege escalation |
| Role assignments | Admin actions and data exposure |
| Audit log | Detection, accountability, incident response |
| Outbound fetch capability | SSRF into internal networks or cloud metadata |
| Upload pipeline | Malware, stored XSS, path traversal |
| Signing key and environment | Session forgery, full compromise |
| CI credentials | Supply-chain compromise |

## 3. Actors

- Anonymous internet user.
- Authenticated viewer or editor.
- Admin.
- Attacker with a stolen session cookie.
- Malicious contributor or compromised dependency.
- Insider with database access.

## 4. Trust boundaries

1. Browser → proxy/CDN: untrusted headers, cookies and URLs.
2. Proxy → application: the proxy only gates navigation; authorization must be re-checked server-side.
3. Application → database: queries must be parameterized through Drizzle.
4. Application → outbound internet: untrusted destination, must be allowlisted and private-IP checked.
5. Application → uploaded content: untrusted bytes and file names.
6. CI → repository and release: untrusted pull requests versus privileged workflows.

## 5. STRIDE analysis

| Threat | Example | Mitigation | Residual risk |
| --- | --- | --- | --- |
| Spoofing | Stolen or forged session cookie | HttpOnly, Secure, SameSite cookies; signed sessions; short lifetime | Malware on the client can still steal cookies |
| Tampering | Client sends a forged role or user id | Roles are never accepted from the client; server reads the session and database | Database compromise |
| Repudiation | Admin denies changing a role | Append-only audit log with actor, action, target and timestamp | Logs are local and can be deleted by a host admin |
| Information disclosure | SSRF to cloud metadata or internal services | HTTPS only, host allowlist, private-IP blocking, redirect re-validation, size and time caps | DNS rebinding window; no network-level egress policy |
| Denial of service | Brute force or fetch flooding | Better Auth rate limits; per-user/per-IP preview buckets | In-memory buckets reset on deploy and do not coordinate across instances |
| Elevation of privilege | Editor reaches `/admin` | Server-side `can()` checks on every admin page and action; admins cannot change their own role | A logic bug in a new route that forgets the check |
| XSS | Injected script in user content | React escaping, strict CSP with nonce, no `dangerouslySetInnerHTML` | Future code may add unsafe HTML; CSP allows inline style attributes |
| Path traversal | Upload named `../../etc/passwd` | Name validation, random stored name, no filesystem write in the demo | A future storage adapter must preserve these checks |
| Malicious upload | Polyglot or spoofed MIME | Magic-byte detection, extension and declared-type match, size cap | Antivirus scanning is not included |
| Supply chain | Compromised npm package or Action | Lockfile, Dependabot, action SHA pins, CodeQL/Semgrep/Trivy/OSV | No signature verification or provenance gate yet |
| Secret leakage | Key committed or sent to the client | Environment schema, `.env*` ignored, Gitleaks in CI, no secrets in client imports | A developer can still hardcode a secret |

## 6. Abuse cases reviewed

- Anonymous user requests `/dashboard` or `/admin`: proxy redirects, page re-validates session.
- Viewer calls the preview or upload API: 403 from the server-side policy.
- Editor submits `https://127.0.0.1`, `http://`, credentials in the URL, a non-allowlisted host, or a redirect to a private address: rejected.
- Admin tries to demote themselves: rejected.
- Attacker uploads a text file renamed to `.png`: rejected by magic bytes.
- Attacker sends a huge payload: rejected by Content-Length and size checks.
- Attacker injects an email or token into audit metadata: redacted before storage.

## 7. Assumptions

- TLS terminates at a trusted proxy and HSTS is honored.
- The database is not exposed to the internet.
- The allowlist is managed by the operator and contains only intended destinations.
- Demo accounts are removed before production.

## 8. Out of scope

- Compromised developer machines or browsers.
- Physical access to the host.
- Vulnerabilities in Better Auth, Next.js or Drizzle themselves (report upstream).
- DDoS at the network edge.
- Compliance certification (this document is not an audit).
