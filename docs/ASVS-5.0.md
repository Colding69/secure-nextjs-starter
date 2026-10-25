# OWASP ASVS 5.0 mapping (Level 2 subset)

This is a mapping of implemented controls, not a certification. Status values:

- **Implemented** — code and an automated or reproducible check exist.
- **Partial** — control exists with documented limitations.
- **Operator** — must be completed in the deployment environment.

| ASVS area | Control | Status | Evidence |
| --- | --- | --- | --- |
| V1 Encoding | Output encoding for user data | Implemented | React escaping; no `dangerouslySetInnerHTML` |
| V1 Encoding | Context-aware encoding | Partial | Rely on React; review any future raw HTML |
| V2 Authentication | Password minimum length | Implemented | `minPasswordLength: 12` in `src/lib/auth.ts` |
| V2 Authentication | Brute-force protection | Partial | Better Auth rate limit + proxy; move buckets to Redis for multi-instance |
| V2 Authentication | Credential recovery | Operator | Not included; add a verified recovery flow before production |
| V3 Session | Session cookie flags | Implemented | Better Auth `HttpOnly`, `SameSite`, `Secure` in production |
| V3 Session | Session expiration | Implemented | 7-day expiration, 1-day update age |
| V3 Session | Session invalidation | Partial | Logout and expiration; add global revocation for incidents |
| V4 Access control | Server-side authorization | Implemented | `can()` checks in pages, actions and API routes |
| V4 Access control | Deny by default | Implemented | Unknown roles have no permissions |
| V4 Access control | Admin separation | Implemented | `admin:read` and `users:role` restricted |
| V5 Validation | Input validation | Implemented | Zod environment schema; typed form data |
| V5 Validation | File upload validation | Implemented | Magic bytes, extension, declared type, size cap |
| V6 Cryptography | No custom cryptography | Implemented | Better Auth and platform crypto only |
| V7 Errors and logging | No sensitive data in errors | Implemented | Generic API errors; audit metadata redaction |
| V7 Errors and logging | Security event logging | Implemented | `audit_log` with actor, action, target |
| V8 Data protection | No secrets in client bundles | Implemented | Server-only modules; env schema |
| V9 Communication | HSTS and HTTPS | Implemented | `securityHeaders` + TLS at the edge |
| V10 Malicious code | Dependency and secret scanning | Implemented | Gitleaks, Trivy, OSV, Semgrep, CodeQL |
| V11 Business logic | Role change authorization | Implemented | Server action checks admin and blocks self-demotion |
| V12 Files | Path traversal prevention | Implemented | Name validation and random stored names |
| V13 API | Authentication and authorization on APIs | Implemented | Session + `can()` on preview and upload |
| V13 API | Rate limiting | Partial | In-memory limiter; replace for production |
| V14 Configuration | Security headers and CSP | Implemented | Proxy CSP + `next.config.ts` headers |
| V14 Configuration | Secure defaults | Partial | Demo accounts and SQLite are development defaults |

## Gaps to close before production

1. Password recovery and email verification.
2. Multi-instance rate limiting and account lockout policy.
3. Session revocation and device management.
4. Antivirus/CDR for uploads if files are persisted.
5. Postgres migrations, backups and least-privilege database roles.
6. SIEM shipping and audit retention.
7. Egress firewall or proxy to complement the application-level SSRF guard.
