# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting on this repository:

https://github.com/Colding69/secure-nextjs-starter/security/advisories/new

Include:

- affected version or commit,
- a minimal reproduction,
- impact and required preconditions,
- any suggested fix.

You can expect an initial response within 7 days. Please allow time for a fix and coordinated disclosure before publishing details.

## Scope

In scope:

- authentication and session handling,
- authorization bypasses,
- CSP or security-header bypasses with demonstrated impact,
- SSRF, path traversal, injection or upload validation bypasses in this codebase,
- secret exposure in the repository.

Out of scope:

- findings that require a compromised host or browser,
- missing hardening without a demonstrated attack path,
- vulnerabilities in third-party dependencies that are already public (report them upstream; Dependabot tracks them),
- the demo accounts and the intentionally permissive local development setup.

## Safe harbor

We will not pursue legal action for research conducted in good faith against your own deployment of this project, following this policy and applicable law. Do not test deployments you do not own.
