# secure-nextjs-starter

A security-first Next.js 16 starter for teams that want secure defaults with tests, not a checklist.

It ships authentication, typed RBAC, strict nonce-based CSP, SSRF-safe outbound fetching, rate limiting, append-only audit logging, upload validation, and a CI pipeline with SAST, SCA, secret scanning and an SBOM. Every control listed below has an automated test.

> This is a starter, not a certified product. Read the threat model, remove the demo accounts, and adapt the decisions to your deployment.

## Quickstart

```bash
pnpm install
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. The seed script creates three demo users (viewer, editor, admin) and prints their credentials to the terminal. Passwords are deterministic demo values only; change or delete these accounts before any real deployment.

### Tests and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Security controls

| Control | Implementation | Test |
| --- | --- | --- |
| Authentication | Better Auth, email + password, 12-character minimum, session expiration, cookie cache | Login flow + session checks |
| Authorization | Typed `can(role, permission)` policy, server-side checks, admin-only role changes | `tests/rbac.test.ts` full role × permission matrix |
| CSP | Per-request nonce, `strict-dynamic`, no `unsafe-inline` scripts, `frame-ancestors 'none'` | Header assertions in review and browser |
| Security headers | HSTS, nosniff, referrer policy, permissions policy, COOP/CORP, no `X-Powered-By` | `next.config.ts` + proxy |
| SSRF protection | HTTPS only, host allowlist, private-IP blocking, redirect re-validation, 5s timeout, 1 MB cap | `tests/safe-fetch.test.ts` |
| Rate limiting | Per-user + per-IP buckets on the preview endpoint; Better Auth rate limits auth routes | `tests/rate-limit.test.ts` |
| Audit logging | Append-only table, emails and tokens redacted before storage | `tests/redact.test.ts` |
| Upload validation | Magic-byte detection, extension match, declared-type match, 5 MB cap, random names | `tests/upload.test.ts` |
| Secrets handling | Environment schema, fail-closed in production, no secrets in client bundles | `src/lib/env.ts` |
| CI security gate | Semgrep, CodeQL, Gitleaks, Trivy, OSV-Scanner, CycloneDX SBOM | `.github/workflows/` |

## Roles

| Role | Permissions |
| --- | --- |
| `viewer` | `dashboard:read` |
| `editor` | `dashboard:read`, `preview:fetch`, `upload:create` |
| `admin` | everything above plus `admin:read`, `users:role` |

The proxy blocks unauthenticated navigation to `/dashboard` and `/admin` using the session cookie, and every protected page re-validates the session and role against the database. Never rely on the proxy alone for authorization.

## Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `BETTER_AUTH_URL` | Production | `http://localhost:<PORT>` | Public origin used for trusted origins and cookies |
| `BETTER_AUTH_SECRET` | Production | dev-only fallback | 32+ characters; the app refuses to start in production without it |
| `DATABASE_URL` | No | `./data/app.db` | SQLite path for local development |
| `SAFE_FETCH_ALLOWLIST` | No | `example.com` | Comma-separated hostnames for the SSRF-safe demo |
| `PORT` | No | `3000` | Used to derive the local base URL |

Do not commit real environment files. The repository ignores `.env*`.

## Architecture

```
src/
├─ app/
│  ├─ (auth)/login/            # public login form
│  ├─ (app)/dashboard/         # authenticated area + SSRF demo
│  ├─ (app)/admin/             # admin-only role management
│  └─ api/{auth,preview,upload}/
├─ db/                         # Drizzle schema and SQLite client
├─ lib/
│  ├─ auth.ts                  # Better Auth configuration
│  ├─ rbac.ts                  # typed policy
│  ├─ safe-fetch.ts            # SSRF-safe outbound fetch
│  ├─ rate-limit.ts            # in-memory fixed window
│  ├─ audit.ts                 # redaction + append-only log
│  ├─ upload.ts                # magic-byte validation
│  └─ env.ts                   # fail-closed configuration
└─ proxy.ts                    # CSP nonce, headers, session gate
```

## Security CI

The `security` workflow runs lint, type checking, tests and build, then:

- **Gitleaks** scans the full history for secrets.
- **Semgrep** (`p/default`, ERROR severity) fails the job on findings.
- **CodeQL** runs `security-extended` for JavaScript/TypeScript.
- **Trivy** reports HIGH/CRITICAL dependency and misconfiguration findings.
- **OSV-Scanner** reports known vulnerable dependencies.
- **CycloneDX** produces an SBOM artifact.

Trivy and OSV are report-only in this starter so a new transitive advisory does not block unrelated work. Promote them to blocking once your dependency policy is defined.

## Production checklist

1. Set a random 32+ character signing key and a real `BETTER_AUTH_URL` over HTTPS.
2. Move from SQLite to Postgres (swap the Drizzle adapter) and run migrations.
3. Remove the seed accounts and disable open sign-up if you do not need it.
4. Replace the in-memory rate limiter with Redis or your edge provider's store.
5. Review the CSP for the third-party scripts you actually need; avoid adding `unsafe-inline`.
6. Configure audit log retention and ship logs to your SIEM.
7. Keep dependencies and GitHub Actions pinned and updated (Dependabot is enabled).
8. Run the threat model workshop with your team before launch.

## Documentation

- [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md) — assets, trust boundaries, STRIDE threats and residual risks.
- [`docs/ASVS-5.0.md`](docs/ASVS-5.0.md) — mapped subset of OWASP ASVS 5.0 Level 2 controls.
- [`docs/adr/0001-security-baseline.md`](docs/adr/0001-security-baseline.md) — key trade-offs.
- [`SECURITY.md`](SECURITY.md) — disclosure policy.

## Limitations

- The SSRF guard still has a DNS-rebinding window between resolution and connection. For high-risk egress, use a network proxy with an allowlist or a fetch client with a pinned resolver.
- The rate limiter is per-process and resets on deploy. That is intentional for a local starter.
- CSP allows `style-src-attr 'unsafe-inline'` because React can emit style attributes. Scripts remain nonce-based.
- SQLite is for local development; use Postgres in production.

## License

MIT
