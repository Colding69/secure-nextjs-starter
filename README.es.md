# secure-nextjs-starter (Español)

Starter de Next.js 16 con seguridad por defecto y pruebas para cada control: autenticación con Better Auth, RBAC tipado, CSP estricta con nonce, fetch seguro contra SSRF, rate limiting, audit log con redacción, validación de uploads por magic bytes y pipeline de CI con Semgrep, CodeQL, Gitleaks, Trivy, OSV y SBOM.

## Inicio rápido

```bash
pnpm install
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`. El script de seed crea tres usuarios demo (viewer, editor, admin) e imprime sus credenciales en la terminal. Cámbialos o elimínalos antes de desplegar.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Controles

| Control | Implementación | Prueba |
| --- | --- | --- |
| Autenticación | Better Auth, mínimo 12 caracteres, sesiones con expiración | Flujo de login |
| Autorización | Política `can(role, permission)` verificada en servidor | Matriz completa rol × permiso |
| CSP | Nonce por request, `strict-dynamic`, sin `unsafe-inline` en scripts | Cabeceras |
| SSRF | Solo HTTPS, allowlist, bloqueo de IP privadas, redirects revalidados | `tests/safe-fetch.test.ts` |
| Rate limit | Cubetas por usuario e IP | `tests/rate-limit.test.ts` |
| Auditoría | Tabla append-only con redacción de emails y tokens | `tests/redact.test.ts` |
| Uploads | Magic bytes, extensión y tipo declarado, 5 MB, nombre aleatorio | `tests/upload.test.ts` |

## Roles

- `viewer`: solo lectura del dashboard.
- `editor`: dashboard + fetch seguro + validación de uploads.
- `admin`: todo + gestión de roles.

## Producción

Define una clave de firma de 32+ caracteres, usa HTTPS y Postgres, elimina las cuentas demo, mueve el rate limit a Redis y revisa la CSP con los scripts reales de tu app. El threat model y el mapeo ASVS están en `docs/`.

Este proyecto es un punto de partida, no un producto certificado. Licencia MIT.
