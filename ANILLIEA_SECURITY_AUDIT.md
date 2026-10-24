# ANILLIÉA — Security Audit

**Date:** 2026-10-24  
**Type:** Defensive application-security review  
**Environment:** local repository + isolated test database + local production build. No production system, customer account or external service was attacked.  
**Scope:** authentication, authorization, session handling, API input/output, database access, checkout integrity, file upload, headers, secrets, dependencies, logs and privacy.

---

## 1. Overall security assessment

**Current security posture: NOT PRODUCTION-READY.**

Application-level authorization and transaction handling are substantially stronger than at the start of the audit. The checkout, coupon, stock and admin-order paths were hardened and tested. However, production dependency advisories, non-distributed rate limiting, non-revocable sessions, absent CSP/HSTS and missing MFA/email-verification controls are material residual risks.

| Risk area | Rating | Reason |
|---|---|---|
| Application authorization / IDOR | **Good** | Server-side role checks and ownership filters; tested 401/403/IDOR cases |
| Checkout and inventory integrity | **Good** | Transactional stock CAS, coupon CAS, idempotent compensation; concurrency test passes |
| Authentication implementation | **Fair** | bcrypt 12, strong reset-token hashing, httpOnly cookie; but no session revocation, MFA, lockout or email verification |
| Input/output handling | **Fair** | Zod and React escaping; known malformed-ID/JSON 5xx gaps; JSON-LD fixed |
| Abuse resistance | **Poor at scale** | In-memory rate limiter only |
| Dependency security | **Critical risk** | `npm audit` 1 critical + 6 high in production dependencies |
| Browser/session hardening | **Fair/Poor** | HttpOnly/SameSite/Secure present; no CSP/HSTS; no explicit CSRF token |
| Secrets hygiene | **Good (current tree)** | `.env` ignored; only local Docker credentials in tracked templates; no history scan performed |
| Monitoring / audit integrity | **Partial** | Audit records exist but writes are best-effort and not tamper-evident; no alerting |

No Critical or High *application-code* authorization bypass remained after remediation. That statement does **not** cover dependency vulnerabilities or unavailable infrastructure.

---

## 2. Method and limitations

Performed:

- Read all 58 API route files, auth/session code, cookie code, Prisma schema, admin layout, checkout/payment code, upload handler, email code, audit logger and security headers.
- Ran unit/API integration/browser tests (see `ANILLIEA_TEST_PLAN.md`).
- Tested 401/403/IDOR scenarios, login rate limiting, weak credentials, token tampering/expiry, duplicate checkout, concurrent stock, invalid coupon and unavailable payment.
- Ran `npm audit --omit=dev`.
- Scanned tracked files for common private-key/cloud-token/connection-string patterns.
- Measured Lighthouse best-practice/console behavior to observe exposed probes.

Not performed / unavailable:

- Production/staging penetration test, fuzzing, DAST, dependency exploit attempts.
- SMTP, Blob and payment-gateway testing.
- Distributed/concurrent rate-limit testing across instances.
- Full CSRF, XSS payload matrix, SQL injection payload suite or upload malware scan.
- Git history secret scan with a dedicated scanner; only targeted `git grep`/`git log` checks.
- Backup/restore security, cloud IAM, WAF/CDN configuration.

---

## 3. Assets and trust boundaries

Assets:

- Customer PII: names, emails, phones, addresses, order history.
- Account credentials and reset tokens.
- Admin capability: catalogue, stock, orders, customers, coupons, messages.
- Order/payment state and inventory integrity.
- SMTP, database, JWT and Blob credentials.

Trust boundaries:

```
Internet visitor ──HTTPS──▶ Next.js public pages/APIs
Internet customer ──JWT cookie──▶ customer APIs/pages
Admin ──JWT cookie + ADMIN role──▶ /admin and /api/admin
Next.js server ──DATABASE_URL──▶ PostgreSQL
Next.js server ──SMTP/BLOB──▶ external services
```

- Middleware checks only that a cookie exists. **All real authorization relies on route/page guards** that verify the JWT and reload the user from the database.
- Admin and customer share one User model with `Role.ADMIN`/`Role.CUSTOMER`; there are no finer staff roles.
- No service-to-service API tokens or webhooks exist (no online payment gateway).

---

## 4. Confirmed findings

### 4.1 Open

| ID | Severity | Finding | Evidence / impact | Remediation |
|---|---|---|---|---|
| SEC-01 | **Critical** | Production dependency advisories | `npm audit --omit=dev`: 7 vulnerabilities — 1 critical, 6 high. Critical Next.js 14.2.35 advisory group includes RCE/DoS/XSS classes; `postcss`, `undici`, `zod`, `@vercel/cli-config`, `@vercel/oidc`, `@vercel/blob` are also affected. Suggested fix is Next 16.4.3 (breaking). | Upgrade in a controlled branch; run full regression and manual QA; deploy a patched release. Do not blindly `npm audit fix --force`. |
| SEC-02 | **High** | In-memory rate limiting | `lib/utils/rate-limit.ts`; login 429 works on one process. On Vercel/serverless or multiple instances each instance has its own buckets; restart clears counters. IP is derived from request headers without an explicit trusted-proxy policy. | Shared Redis/Upstash or gateway/WAF rate limiting; define trusted proxy hops; keep tight limits on login/reset/coupon/contact/newsletter. |
| SEC-03 | **Medium** | No session revocation | 7-day stateless JWT; password change/reset does not invalidate existing tokens. Test coverage confirms token validity, not revocation. | Add `sessionVersion` or `passwordChangedAt` and reject tokens issued before it; consider shorter admin sessions. |
| SEC-04 | **Medium** | Missing CSP and HSTS | `next.config.mjs` sets XFO, nosniff, Referrer-Policy and Permissions-Policy, but no Content-Security-Policy or Strict-Transport-Security. | Add a report-only CSP, tune it, then enforce; add HSTS at the host/CDN after HTTPS is guaranteed. |
| SEC-05 | **Medium** | No email verification, admin MFA or account lockout | `emailVerified` exists but login does not require it; no TOTP; only IP rate limiting. | Add email verification, TOTP for admin, optional MFA for customers, and lockout/backoff with alerting. |
| SEC-06 | **Medium** | Audit logs are best-effort and not tamper-evident | Many admin routes call `void logAudit(...)`; `logAudit` swallows failures and only console-errors. An action can succeed without an audit row. No immutable storage/retention policy. | Write audit rows in the same transaction where appropriate, or queue reliably; add retention, access control and tamper-evident storage/export. |
| SEC-07 | **Low** | Malformed IDs/JSON can become 500 | Only admin order route validates UUID params; direct `req.json()` can throw SyntaxError. Not executed, code-reviewed. | Shared UUID param guard → 404; safe JSON parse → 400; test both. |
| SEC-08 | **Low** | HTML injection into transactional email | `forgot-password` interpolates `user.name` and the reset link into HTML without escaping. Impact is limited to email rendering/client sanitization. | HTML-escape user-controlled values in email templates; keep plain-text alternative. |
| SEC-09 | **Low** | Upload has no malware/content disarm | Magic bytes block disguised non-images and SVG is not allowed, but images are not re-encoded or scanned. Public Blob URLs are accessible to anyone with the URL. | Re-encode images server-side (strip metadata/active payloads), add AV scanning if uploads become untrusted, keep a 5 MB cap. |
| SEC-10 | **Low** | Personal admin email in public defaults | `.env.example` and README contain a real-looking administrator email as the seed default. It is not a password/API key, but unnecessary PII exposure. | Replace with `admin@example.com` or a brand address; keep real values only in environment secrets. |
| SEC-11 | **Low** | Expected 401 console probes | Logged-out pages probe `/api/auth/me`, `/api/cart`, `/api/wishlist`; Lighthouse Best Practices loses points and browser console noise is generated. No data leakage beyond 401 shapes. | Optional: gate probes until session presence is known, or filter expected probes in monitoring/tests. |

### 4.2 Remediated during this audit

| ID | Original severity | Finding | Remediation | Verification |
|---|---|---|---|---|
| SEC-R1 | High | Checkout stock race / duplicate order | Per-user advisory lock, in-tx revalidation, conditional stock update | Workflow D: one of two concurrent buyers succeeds; one order; stock 0 |
| SEC-R2 | High | Coupon usage-limit race | Conditional `updateMany` claim; rollback on failure | Usage-limit test; cancellation restore |
| SEC-R3 | High | Admin cancel/return did not fully compensate inventory/coupon | CAS transition + one-time compensation | Cancel/restock/repeat-cancel test |
| SEC-R4 | High | Open redirect via `next` query | Same-origin path allowlist | Code review + login E2E; bypass unit test still absent |
| SEC-R5 | High | Password-reset token stored raw | SHA-256 digest only; single-use, 1-hour expiry | 3 unit tests |
| SEC-R6 | High | Debug diagnostics exposed via auth/diag | Plain 401; `/api/auth/me` DTO; diag Bearer token in production, booleans/counts only | Auth test + code review |
| SEC-R7 | High | JWT dev fallback usable in production | Production throws when `JWT_SECRET` is missing | Code review + typecheck |
| SEC-R8 | Medium | Upload trusted client MIME/extension | JPEG/PNG/WebP/GIF magic-byte verification; 5 MB; random filename; admin only | Code review; runtime upload not verified |
| SEC-R9 | Medium | JSON-LD could terminate script tag | `serializeJsonLd` escapes `<` | 2 unit tests |
| SEC-R10 | Low | Public coupon validation unthrottled | 30/min/IP | Code review; 429 not exercised |
| SEC-R11 | Low | Raw role/session diagnostics in `/api/auth/me` | Removed; test asserts no `diag` | API test |

---

## 5. Authentication and session review

### Password handling

- bcryptjs with cost factor 12 (`lib/auth/password.ts`); plaintext is never stored.
- Policy: minimum 8, maximum 128 characters. No breached-password list, complexity rule or periodic rotation. Reasonable minimum, but weak by modern admin standards.
- Login responses do not distinguish unknown email from wrong password (tested).
- Registration necessarily reveals an existing email via 409 (normal, low enumeration value).
- Password change requires the current password (code review, not executed).
- Password reset:
  - 32 random bytes, 1-hour expiry, single-use digest lookup.
  - Generic response for unknown emails.
  - Production returns 503 if SMTP is not configured; it does not falsely claim an email was sent.
  - Reset does not revoke other sessions (SEC-03).

### JWT/session

- HS256 JWT, 7-day expiry, payload `{ sub, role }`.
- Secret is read lazily; production refuses the development fallback.
- No `issuer`/`audience` claims and no key rotation ID. With a single secret this is not an auth bypass, but it reduces key-rotation and token-confusion hygiene.
- Logout clears the cookie but cannot invalidate a copied token. There is no server-side denylist.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` when HTTPS/Vercel. This is a solid baseline.
- CSRF: `SameSite=Lax` blocks cookies on cross-site POSTs in modern browsers; state-changing endpoints require JSON/multipart and no permissive CORS exists. However, there is no explicit Origin/CSRF-token check and no browser-level CSRF test. Treat as **PARTIAL**, low residual.
- Admin and customer use the same cookie name; role is re-read from the database, so a stale JWT cannot preserve a removed admin role.

### Brute force and account abuse

- Login: 10/min/IP (tested 429).
- Register: 10/min/IP; forgot: 5/hour/IP; reset: 10/hour/IP.
- No per-account lockout, CAPTCHA, breached-credential check or known-device alert.
- Limits are instance-local and depend on trustworthy client IP headers.

---

## 6. Authorization review

Verified by tests:

- Unauthenticated admin API → 401.
- Customer admin API → 403 for dashboard, products and orders.
- Admin dashboard works; customer cannot read another customer's order.
- Single-admin enforcement prevents creating a second administrator and prevents self-demotion.
- Unknown user operations return 404 in tested admin policy cases.

Code review:

- Every `/api/admin/*` handler calls `requireAdmin`.
- Customer routes call `requireUser`; queries filter by the authenticated user ID for orders, addresses, cart, wishlist and notifications.
- Wishlist and address dynamic operations include ownership in the query, not just the URL ID.
- Admin layout verifies the user and role server-side; middleware is only a presence fast-fail.
- Admin product/order views are protected by the same session/role checks.

Residual authorization concerns:

- Dynamic resource IDs are generally UUIDs, which reduces enumeration, but malformed IDs can return 500.
- No finer-grained staff permissions (an ADMIN can do everything).
- No API-level test for every admin mutation; “reviewed only” is not proof.

---

## 7. Injection, upload and browser security

| Threat | Assessment |
|---|---|
| SQL injection | **Low.** Prisma parameterizes queries; the raw advisory-lock/stock statements use tagged-template parameters and casts. No string-concatenated SQL was found. |
| Stored/reflected XSS | **Low after fix.** React escapes by default; the only `dangerouslySetInnerHTML` sink is JSON-LD, now escaped. No raw article HTML sink was found. No automated XSS payload test was run. |
| Open redirect | **Fixed.** Login only accepts same-origin absolute paths. |
| SSRF | **Low.** `next/image` remote patterns allow only `*.public.blob.vercel-storage.com`; uploads do not fetch URLs. No server-side arbitrary URL fetch was found. |
| Unsafe uploads | **Reduced.** Admin-only, magic-byte checks, random names, no SVG; still no AV/re-encode and public Blob URLs. |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` present; no CSP `frame-ancestors`. |
| MIME sniffing | `X-Content-Type-Options: nosniff` present. |
| Referrer leakage | `Referrer-Policy: origin-when-cross-origin`; reset token path is not sent cross-origin. Good. |
| CORS | No permissive ACAO headers found; same-origin default. Add allowlist only if needed. |
| Security headers | Partial; CSP/HSTS absent (SEC-04). |

Security headers currently configured:

```
X-DNS-Prefetch-Control: on
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.

---

## 8. Dependency and supply-chain risk

`npm audit --omit=dev` (read-only) on 2026-10-24:

```
7 vulnerabilities (6 high, 1 critical)
next            critical  (multiple advisories; installed 14.2.35)
postcss         high
undici          high
zod             high
@vercel/cli-config, @vercel/oidc, @vercel/blob  high chain
```

The Next.js advisory range includes DoS, cache poisoning, XSS, SSRF and RCE classes. The app does not use every affected feature (for example, no Server Actions or WebSocket upgrades were found), so not every advisory is necessarily exploitable here. That requires an applicability review during the upgrade; it is not a reason to defer patching.

`npm audit fix --force` proposes Next 16.4.3 and Zod 4.6.7 — both breaking changes. Do not deploy that automatically. Plan a supported major upgrade, update React/ESLint config as required, run all tests and a manual checkout/admin pass, then stage and deploy.

Other supply-chain observations:

- No CI dependency review or lockfile-integrity policy; `package-lock.json` is committed.
- No Dependabot/Renovate configuration.
- No SRI for external Google Fonts; fonts are CSS, not scripts, but external availability affects privacy/performance.
- `npx lighthouse` was used only for the audit and is not a runtime dependency.

---

## 9. Secrets and configuration

- `.env` and `.env*.local` are gitignored and not tracked.
- Only `.env.example` is tracked. It contains placeholders and local Docker DB credentials (`anilliea:anilliea@localhost`), which are not production secrets.
- A targeted scan for private keys, AWS keys, live Stripe secrets and credentialed Postgres URLs in tracked files found only those local defaults. No production secret was observed.
- No full git-history scan (gitleaks/trufflehog) or cloud secret-manager verification was performed.
- `JWT_SECRET` is mandatory only in production; development defaults to a well-known fallback. That is acceptable only for local development.
- `DIAG_TOKEN` is optional; if unset in production, `/api/diag` is disabled. If set, use a long random value and Bearer header.
- Real administrator email is present as a default (SEC-10). Replace before public distribution.
- Database credentials should use a least-privilege role; this was not verifiable.

---

## 10. Logging, audit and privacy

- `AuditLog` records admin actions: actor, action, entity, entity ID, metadata, IP and timestamp.
- Product/category/collection/coupon/inventory/journal/message/media/order/user/email-change actions call `logAudit`.
- Many calls are fire-and-forget; audit failure is swallowed and only console-logged. There is no transaction coupling, alert, retention schedule or external immutable sink (SEC-06).
- No passwords, password hashes or reset tokens are intentionally written to logs. Error logging of Prisma exceptions could theoretically include query parameters; not verified with production error output.
- Customer PII is stored in users, addresses, orders, messages, newsletter and reviews. Admin access is role-gated; there is no data-retention/deletion policy, export process or privacy notice review in this audit.
- Expected logged-out probes generate 401 console noise; they do not expose data.
- No Sentry/APM/uptime monitoring was available, so security events cannot currently be alerted on.

---

## 11. Availability and abuse

- Checkout uses transactions to avoid partial orders/stock loss.
- Rate limiting exists for auth, contact, newsletter and coupon validation.
- No global request-size limit beyond Next defaults/body parsing; uploads have a 5 MB cap.
- No bot protection/CAPTCHA on registration, login, contact or newsletter.
- No queue/backpressure for email; email is best-effort and cannot block checkout.
- Database connection pooling is delegated to Prisma/host; production pool sizing was not verified.

---

## 12. Prioritized remediation

### P0

1. Upgrade Next.js and affected dependencies; rerun all tests and manual QA.
2. Replace in-process rate limiting with shared infrastructure.
3. Ensure production JWT secret strength, HTTPS, HSTS and a staged CSP.
4. Remove real admin email from public defaults; verify no secrets in deployment env.

### P1

1. Session revocation on password change/reset; shorter admin session/idle timeout.
2. Admin MFA, email verification, lockout/backoff and alerting.
3. Durable audit logging (no swallowed failures) with retention/access controls.
4. UUID/JSON error normalization; add automated tests.
5. Escape email HTML; consider upload re-encoding/AV.
6. Set up monitoring, alerting, backup restore drill and staging security smoke.

### Verification required after fixes

- `npm audit` clean for production (or documented accepted risk with compensating controls).
- Auth/rate-limit tests across multiple instances.
- Password change invalidates old tokens (test).
- CSP enforced without breaking checkout/admin.
- 400/404 behavior for malformed inputs (tests).
- Audit row exists for every sensitive admin action, including failure simulation.
- Staging headers verified with `curl -I` over HTTPS.

---

## 13. Final security statement

The application now has sound application-level authorization and transactional e-commerce controls for its current scope, verified by automated tests. It should **not** be exposed to real customers or used to accept live orders until the P0 dependency/infrastructure work and the P1 session/audit/email/security-header work are complete. No claim of “secure” is made beyond the evidence above; no external penetration test has been performed.
