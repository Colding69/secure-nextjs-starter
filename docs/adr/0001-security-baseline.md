# ADR 0001: Security baseline and trade-offs

Date: 2026-10-25
Status: Accepted

## Context

The goal is a public, runnable Next.js starter that demonstrates AppSec engineering: secure defaults, tests for each control, and a CI pipeline that catches regressions. It must stay small enough to read and extend.

## Decisions

### Next.js 16 App Router with TypeScript strict mode

Use the current stable framework and strict types. `src/proxy.ts` replaces the deprecated middleware convention.

### Better Auth instead of a hosted identity provider

Self-hosted sessions keep the demo independent of a vendor and make the security behavior inspectable. The trade-off is that password recovery, email verification and MFA are left to the adopter.

### Drizzle + SQLite for local development

Zero-setup local runs. The schema is portable to Postgres by swapping the adapter. SQLite is explicitly not a production recommendation.

### Typed policy instead of a heavy authorization framework

A small `can(role, permission)` function is easy to test and audit. If the permission model grows into resource-level rules, replace it with a policy engine rather than extending ad-hoc checks.

### In-memory rate limiting

Simple and dependency-free. It does not coordinate across instances, so production deployments must swap in Redis or an edge limiter.

### CSP with nonce and `style-src-attr 'unsafe-inline'`

Scripts remain strict. React can emit style attributes, so blocking inline style attributes would break ordinary UI code. Documented as a residual risk.

### Report-only Trivy and OSV in CI

A new transitive advisory should not block unrelated pull requests in a starter. Teams should promote these to blocking once they define a dependency policy.

### Pin GitHub Actions by commit SHA

Reduces supply-chain risk from moving tags. Dependabot updates the pins.

## Consequences

- The starter is intentionally incomplete for production: recovery, MFA, Postgres migrations, distributed rate limiting and egress controls are left to the adopter.
- Security regressions are caught by tests and CI, but the threat model must be revisited when new routes or integrations are added.
