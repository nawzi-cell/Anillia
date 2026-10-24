# ANILLIÉA — Full-Stack Application Audit

**Audit date:** 2026-10-24  
**Repository:** `C:\Users\nawzi\Desktop\web\New folder\Anillia`  
**Branch / revision:** `main`, HEAD `2c77752` plus uncommitted audit changes  
**Auditor environment:** Windows 11, Node 24.18.0, Google Chrome (local), Docker PostgreSQL 16  
**Application versions:** Next.js 14.2.35, React 18.3.1, Prisma 5.22.0, TypeScript 5.6.3, Tailwind CSS 3.4.14, Vitest 2.1.3  
**Production/staging access:** none. No production database, SMTP, Blob store, payment gateway, hosting dashboard or backup system was available. No production data was read, changed or deleted.

> Evidence rule: every result below was produced by a command or browser run recorded during this audit. Items that could not be exercised are explicitly labelled **NOT VERIFIED**. No result is inferred from the presence of UI.

---

## A. Executive summary

ANILLIÉA is a functional, well-structured local e-commerce application, not a mock. The core catalogue, signed-in cart, coupon, checkout, inventory, order-history, wishlist, admin-order, dashboard and role-separation flows are connected to PostgreSQL and are covered by real tests.

The audit found and fixed serious correctness and security defects: a checkout/inventory race, coupon-limit races, missing stock/coupon restoration on cancellation, an open redirect, password-reset tokens stored in plaintext, a production JWT fallback secret, diagnostic leakage, unsafe upload trust, JSON-LD script injection, several broken session/availability/wishlist paths, and mobile/accessibility defects. After the fixes:

- **54/54 unit tests pass** (9 files).
- **50/50 API integration tests pass** (7 files) against an isolated PostgreSQL test database.
- **Browser smoke tests pass** against the production build, at all seven required widths, including customer login persistence, add-to-cart, cart page and admin dashboard.
- **Production build succeeds** (`Compiled successfully`).
- **TypeScript passes** with `--noEmit`.
- **ESLint reports 0 errors and 5 warnings.**
- **Lighthouse (local production build, mobile) reports Accessibility 100, SEO 100, Best Practices 96, Performance 84**; zero contrast failures after the accessibility fixes.

The application is **not production-ready yet**. The blocking risks are external to the fixed code paths:

1. `npm audit --omit=dev` reports **1 critical and 6 high** production-dependency advisories, dominated by Next.js 14.2.35. The suggested fix is a breaking Next.js 16 upgrade and was deliberately not applied during the audit.
2. Rate limiting is in-process memory, so it is not reliable across serverless/multi-instance deployments.
3. Sessions are stateless 7-day JWTs and are not revoked on password change/reset.
4. There is no CSP or HSTS configuration in `next.config.mjs`.
5. SMTP, Vercel Blob, an online payment gateway, backups and staging were unavailable; those paths are implemented defensively but **NOT VERIFIED** externally.
6. There is no CI/CD, error monitoring or metrics; no backup restore drill was possible.

Readiness is assessed separately in Section M. Do not accept live card payments or rely on email delivery until the P0/P1 work in Section L is complete.

### Measured verification summary

| Check | Command | Result |
|---|---|---|
| Install state | `npm ls next prisma @prisma/client --depth=0` | next 14.2.35, prisma 5.22.0, @prisma/client 5.22.0 |
| TypeScript | `npx tsc --noEmit` | PASS (no output) |
| ESLint | `npm run lint` | PASS with 5 warnings, 0 errors |
| Unit tests | `npm test` | **9 files, 54 tests passed** |
| API integration | `npm run test:api` | **7 files, 50 tests passed** (39.5 s) |
| Production build | `npm run build` | **Compiled successfully** |
| Browser smoke | `npm run test:e2e` against `npm start` | **All browser checks passed** |
| Responsive overflow | E2E sweep at 375/390/430/768/1024/1280/1440 | **0 px at every width** |
| Lighthouse | local `npm start`, Chrome headless, mobile preset | Performance 84, Accessibility 100, Best Practices 96, SEO 100 |
| Production dependency audit | `npm audit --omit=dev` | **7 vulnerabilities: 1 critical, 6 high** |

Lighthouse detail: FCP 3.3 s, LCP 3.5 s, TBT 60 ms, CLS 0, Speed Index 3.3 s. These are local-lab numbers, not deployed-network measurements.

---

## B. Architecture assessment

### Actual stack

| Layer | Implementation |
|---|---|
| Frontend | Next.js 14.2.35 App Router, React Server Components + client components, Tailwind CSS, Framer Motion, lucide-react |
| Backend | Next.js Route Handlers under `app/api/`; framework-free domain logic in `lib/` |
| Language | TypeScript 5.6.3, strict mode |
| Database | PostgreSQL 16 via Prisma 5.22.0; Docker Compose for local development |
| Authentication | Email/password, bcryptjs (12 rounds), HS256 JWT in httpOnly `anilliea_session` cookie, 7-day lifetime |
| Authorization | `requireUser` / `requireAdmin` server-side guards; route-level checks; Edge middleware cookie-presence fast-fail |
| Validation | Zod schemas in `lib/validation/schemas.ts`; route-specific schemas where needed |
| Payments | Provider abstraction for COD, manual bank transfer and intentionally unavailable ONLINE |
| Email | Nodemailer SMTP; console fallback in development; production password-reset refuses to claim success without SMTP |
| Media | Local `public/` images; admin uploads to Vercel Blob in production, local `public/uploads/` fallback in development |
| Tests | Vitest unit tests, Vitest API integration against `anilliea_test`, Playwright-Core browser smoke against local Chrome |
| Deployment target | Recommended Vercel + managed PostgreSQL; no deployment configuration or CI pipeline is present |

### Repository shape

- **45 page components** under `app/`, including storefront, account, auth, admin, error and not-found routes.
- **58 API route files / 78 HTTP handlers** under `app/api/`.
- **24 Prisma models, 7 enums**, two committed migrations (`20261004082329_anillia`, `20261004093000_journal_articles`).
- Domain logic is separated into `lib/auth`, `lib/orders`, `lib/coupons`, `lib/cart`, `lib/catalog`, `lib/email`, `lib/payments`, `lib/audit`, `lib/utils`.
- The only external runtime services are PostgreSQL, optional SMTP, optional Vercel Blob and the external Google Fonts stylesheet. No online card gateway is integrated.

### Request flow

```
Browser
  → Next.js page (RSC) or client component
  → /api/* Route Handler
  → Zod validation + requireUser/requireAdmin
  → lib domain logic (pricing, coupons, checkout, status)
  → Prisma transaction → PostgreSQL
  → JSON envelope { success, data } / { success:false, message, errors? }
  → RSC/client revalidation and UI update
```

Checkout flow: authenticated user → address resolved and validated → cart lines re-read in transaction → coupon re-validated and claimed → shipping/totals recalculated server-side → conditional stock decrement → order/order items/payment/notification created → cart cleared → 201. Cancel/return transitions restore stock, sold count and coupon usage.

### Authentication and session model

- JWT payload contains `sub` and `role`.
- Cookie flags: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` when the request is HTTPS (or on Vercel).
- Middleware performs only a cookie-presence fast-fail for `/admin`, `/account`, `/api/admin`; it does **not** verify the JWT. Every protected page and route re-verifies the token and fetches the current user from the database.
- Admin page layout verifies the session directly rather than making an HTTP self-fetch, avoiding failures when `NEXT_PUBLIC_APP_URL` does not point to the current instance.
- There is no refresh-token rotation and no server-side session registry.

### Data and business rules

- All money is whole-PKR integers: subtotal, discount, delivery fee, total, prices and coupon value.
- Standard delivery PKR 250, express PKR 450; standard is free when `subtotal − discount >= 5000`.
- Coupons: percentage or fixed amount, minimum order, maximum discount, usage limit, start/expiry window, one use per customer (enforced in checkout).
- Order items preserve product name, variant name, SKU, unit price and line subtotal as snapshots.
- Order status machine (`lib/orders/status.ts`): `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`; cancellation from early states; `RETURN_REQUESTED → RETURNED|DELIVERED`; `CANCELLED` and `RETURNED` are terminal. Same-status updates are idempotent no-ops.

### Testing architecture

- `vitest.config.ts` runs framework-free unit tests.
- `vitest.api.config.ts` plus `tests/api/provision-db.ts` create/reset only an isolated test database and seed deterministic fixtures.
- `tests/e2e/smoke.mjs` uses locally installed Chrome through `playwright-core`; it does not download a browser.
- Screenshots are written to `tests/e2e/artifacts/`, which is gitignored.

---

## C. Findings register

Severity reflects business/security impact. “Fixed” means changed in this audit and re-tested where stated. Findings that remain open are repeated in Section K and the roadmap.

| ID | Severity | Finding / category / affected files | Evidence and reproduction | Root cause and business impact | Fix status and verification |
|---|---|---|---|---|---|
| F-01 | **Critical** | Checkout could oversell stock or create duplicate orders under concurrency / data integrity / `lib/orders/checkout.ts` | Baseline read-then-write stock logic; two simultaneous checkouts for the last unit. | Availability was checked outside a serialized update. Two customers could pay for one unit; duplicate submission could create duplicate orders. | **Fixed.** Per-user PostgreSQL advisory lock, in-transaction revalidation, conditional stock `UPDATE ... WHERE quantity - reserved >= requested`, cart clear and order creation in one transaction. Workflow D passes: exactly one order, loser gets 409/422, stock ends at 0. |
| F-02 | **High** | Coupon usage limit could be exceeded concurrently / data integrity / `lib/orders/checkout.ts`, `lib/coupons/engine.ts` | Two checkouts using the last allowed use of a single-use coupon. | Usage was validated then incremented without an atomic claim. | **Fixed.** Coupon `usedCount` claimed with conditional `updateMany`; failure aborts checkout. API workflow test confirms first order succeeds, second is rejected with no side effects, and cancellation restores usage. |
| F-03 | **High** | Cancelling/returning an order did not fully reverse inventory, sold count and coupon usage / admin orders / `app/api/admin/orders/[id]/route.ts` | Baseline admin PUT transition; compare stock before/after cancel; retry cancel. | Transition handling did not consistently compensate stock/coupon state; retries could double-restore. | **Fixed.** CAS status update, compensation only on first entry into CANCELLED/RETURNED, payment sync, notification. Tested: cancel restores all three; repeat cancel returns 200 with no second restore. |
| F-04 | **High** | Open redirect through `/login?next=` / authentication / `app/login/page.tsx` | `next=//evil.example` or `next=/\evil.example` could navigate off-site after login. | The client accepted any string beginning with `/`. Phishing impact after a real login. | **Fixed.** Only same-origin paths are accepted; protocol-relative and backslash-normalized paths fall back to `/`. Login browser flow passes; a dedicated redirect-bypass test is not present. |
| F-05 | **High** | Session/diagnostic leakage in auth responses / information disclosure / `app/api/auth/me/route.ts`, `app/api/diag/route.ts` | `/api/auth/me` previously returned troubleshooting diagnostics; `/api/diag` was broadly reachable. | Debug scaffolding survived into request handling and could reveal internal state. | **Fixed.** `/api/auth/me` returns a plain 401 or `{ user }` DTO; diagnostics require `Authorization: Bearer $DIAG_TOKEN` in production and report booleans/counts only. Test asserts the 401 contains no `diag`. |
| F-06 | **High** | Password-reset tokens stored in plaintext / authentication / `lib/auth/tokens.ts`, forgot/reset routes | Database field previously contained the raw token that was emailed. | A database read or backup leak would allow immediate account takeover. | **Fixed.** Only SHA-256 digest stored; raw token exists only in the emailed link; single-use and 1-hour expiry. 3 unit tests cover hashing; external email delivery NOT VERIFIED. |
| F-07 | **High** | Production could sign JWTs with a public development fallback / authentication / `lib/auth/jwt.ts` | Production with `JWT_SECRET` unset. | Anyone knowing the fallback could forge admin sessions. | **Fixed.** Production now throws if `JWT_SECRET` is absent; fallback is development-only. Code review + typecheck; no dedicated production-env test. |
| F-08 | **Medium** | Upload validation trusted client MIME/extension / file upload / `app/api/admin/upload/route.ts` | Upload a non-image renamed to `.png` with an image MIME. | The server could store arbitrary content under an image extension/URL. | **Fixed.** Server checks JPEG/PNG/GIF/WebP magic bytes, 5 MB limit, random filename, admin-only. Runtime upload NOT VERIFIED because no Blob token; no automated upload test. |
| F-09 | **Medium** | JSON-LD was serialized without escaping `<` / stored XSS defense / `components/shared/JsonLd.tsx`, `lib/utils/json-ld.ts` | Admin-authored text containing `</script>` in product/journal data. | Content could terminate the script element and inject markup for customers. | **Fixed.** Dedicated serializer escapes `<`; 2 unit tests included in the 54 passing tests. |
| F-10 | **Medium** | Full-stock availability was not aggregated correctly across variants / catalogue / `lib/catalog/products.ts` | Products with multiple variants reported misleading availability. | Customers could see an unavailability or availability state that did not match actual purchasable stock. | **Fixed.** Aggregation aligns product-level and variant inventory; PDP/browser checks pass. |
| F-11 | **Medium** | Wishlist could not represent a specific variant / wishlist / `hooks/useWishlist.tsx`, `app/api/wishlist/route.ts`, `app/(store)/wishlist/page.tsx` | Add a variant to wishlist, open wishlist, attempt add-to-cart. | Variant information was lost, producing an unusable or wrong selection. | **Fixed.** Wishlist carries the selected variant and resolves available stock. API wishlist add/list/remove tests pass; wishlist page renders. |
| F-12 | **Medium** | Admin page could bounce a valid admin to `/login` / reliability/authorization / `app/admin/layout.tsx` | Admin session valid, but `NEXT_PUBLIC_APP_URL` points to a different local port/tunnel. | Layout verified the session via an HTTP self-fetch to the configured URL instead of the request itself. | **Fixed.** Layout calls `getCurrentUser()` directly. Admin 401/403 tests and browser admin journey pass. |
| F-13 | **Medium** | Admin dashboard labelled non-cancelled order totals as revenue / misleading reporting / `app/admin/page.tsx` | Dashboard shows order value that includes unpaid COD/bank-transfer orders. | Business decisions could treat pending cash as collected revenue. | **Fixed.** Labels now say “Order value (non-cancelled)” and explain that unpaid orders are included. Dashboard API test and screenshot pass. |
| F-14 | **Medium** | Mobile PDP primary CTA wrapped awkwardly / UI / `app/(store)/product/[slug]/ProductPurchase.tsx` | 375 px product page. | Quantity, wishlist and ADD TO BAG competed for one row; label wrapped. | **Fixed.** Quantity + heart on one row, full-width add-to-bag below on mobile. Screenshot re-checked; overflow remains 0 px. |
| F-15 | **Medium** | WCAG AA contrast failures and accessible-name mismatch / accessibility / `tailwind.config.ts`, homepage, `components/products/ProductCard.tsx`, footer | Lighthouse mobile: 41 contrast failures (taupe labels 3.82–4.05:1; category text 1.62–1.79:1; olive CTA 3.2–3.98:1) and one label-content-name mismatch (`−25%`). | Low-contrast microcopy and image overlays reduce readability, especially on mobile. | **Fixed.** Darkened taupe token, stronger category gradients, darker olive CTA, ivory discount badge, removed conflicting card `aria-label`, lightened footer note. Lighthouse Accessibility rose 96 → **100**, contrast failures 41 → **0**. |
| F-16 | **Low** | Labels could be unassociated with inputs / accessibility / `components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx` | A caller omits both `id` and `name`. | Screen readers cannot reliably associate the label. | **Fixed.** Generated `useId` fallback. No axe/VR test added; verified by code review. |
| F-17 | **Low** | Password reset/order email could claim delivery when SMTP was absent / honesty / `app/api/auth/forgot-password/route.ts`, `lib/email/index.ts` | Production without `SMTP_HOST`; request reset. | Users wait for an email that cannot arrive. | **Fixed.** Reset returns 503 with a contact instruction; order email remains best-effort and checkout never fails. SMTP delivery NOT VERIFIED. |
| F-18 | **Low** | Vercel Blob URLs were rejected by `next/image` / media / `next.config.mjs` | Upload an image in production with Blob configured. | Admin product images would not render through the image component. | **Fixed.** `*.public.blob.vercel-storage.com` allow-listed. NOT VERIFIED without a Blob store. |
| F-19 | **Low** | Public coupon validation had no rate limit / abuse / `app/api/coupons/validate/route.ts` | Repeated code guessing. | Code enumeration and database load. | **Fixed.** 30 requests/minute/IP. Public endpoint and code-guessing feasibility remain; dedicated 429 test not added. |
| F-20 | **Low** | Auth session contract differed between server and client (`user` vs wrapped response) / integration / `app/api/auth/me/route.ts`, `lib/api/client.ts`, `hooks/useAuth.tsx` | Login then session re-check. | Client treated a valid session as logged out. | **Fixed.** `/api/auth/me` returns `{ user }`; tests updated; browser session persists across reload. |

### Open findings

| ID | Severity | Finding | Evidence | Recommended action |
|---|---|---|---|---|
| R-01 | **Critical** | Production dependencies contain a critical Next.js advisory set and 6 high advisories (`next`, `postcss`, `undici`, `zod`, `@vercel/blob` chain) | `npm audit --omit=dev` output: 7 vulnerabilities (1 critical, 6 high). Critical range includes Next 14.2.35; suggested fix is `next@16.4.3` (breaking). | Controlled major upgrade in a branch, full regression + manual QA, then deploy. Treat as P0. Do not use `npm audit fix --force` blindly. |
| R-02 | High | Rate limiting is per-process memory keyed by client IP | `lib/utils/rate-limit.ts`; login 429 test passes on one instance. | Move to Redis/Upstash or a gateway/WAF; define trusted proxy handling for `x-forwarded-for`. |
| R-03 | Medium | Existing JWTs survive password change/reset for up to 7 days | Stateless `lib/auth/jwt.ts`; no session version check. | Add `sessionVersion`/`passwordChangedAt` to the user and reject older tokens; or a short-lived access + refresh session store. |
| R-04 | Medium | No Content-Security-Policy or HSTS header | `next.config.mjs` defines XFO, nosniff, Referrer-Policy, Permissions-Policy only. | Add CSP (start report-only) and HSTS at the host/CDN after HTTPS is confirmed. |
| R-05 | Medium | No email verification, MFA, admin lockout or login notification | Schema has `emailVerified` but login does not require it; no MFA UI. | Add verification and at least TOTP for admin; alert on new admin login. |
| R-06 | Medium | External services are unverified | SMTP, Blob, production Postgres, backups, staging and error monitoring unavailable. | Configure staging, send test emails/uploads, run a restore drill, add Sentry/metrics/uptime checks. |
| R-07 | Low | Many dynamic-ID routes return 500 instead of 404 for malformed non-UUID IDs | Only admin orders validates UUID; e.g. `/api/orders/not-a-uuid`, admin category/collection/coupon/inventory/journal/message IDs go to Prisma. | Add a shared UUID param guard (or catch Prisma P2023 as 404). |
| R-08 | Low | Refund/return settlement is manual and incomplete | Admin can set payment status; no gateway refund or bank-transfer reconciliation record. | Document and implement an admin refund workflow with an audit trail before scaling. |
| R-09 | Low | Full UI coverage is incomplete | Checkout UI, password reset UI, most admin CRUD screens and all buttons were not exercised end-to-end. | Add Playwright journeys for checkout, admin CRUD, password reset and form error states. |
| R-10 | Low | No CI/CD, deployment config, migrations-in-CI or observability | No workflow files; README recommends Vercel. | Add CI (typecheck, lint, unit, isolated API tests, build), staging deploy and release checklist. |
| R-11 | Low | Admin browser context logs one expected logged-out 401 (`/api/auth/me`) during login | Final E2E: `Admin-context 401 response paths: /api/auth/me`; pages and data render. | Cosmetic: suppress/filter expected pre-login probes or avoid the probe on the login page. |
| R-12 | Low | Real administrator email appears as the seed default in `.env.example`/README | `ADMIN_EMAIL="nawzirahmed4@gmail.com"`; not a password or key. | Replace with a generic placeholder before public distribution. |

---

## D. Feature verification matrix

Legend: **PASS** = exercised and working; **PARTIAL** = some paths exercised; **FAIL** = exercised and broken; **NOT IMPLEMENTED** = intentionally absent; **NOT VERIFIED** = no sufficient evidence.

| Feature | Status | Evidence / limitation |
|---|---|---|
| Homepage, navigation, header/footer | PASS | Browser render at 7 widths; 0 px overflow; screenshots reviewed |
| Shop listing, category pages, search, pagination | PASS (API) / PARTIAL (UI) | Product list/pagination/search/categories API tests pass; shop and category pages render; sort/filter combinations not individually exercised |
| Product detail, variants, availability | PASS | API detail test; browser Taupe + One Size selection; add-to-cart succeeds; mobile layout verified |
| Cart add/update/remove, stock checks | PASS | API tests: add/re-add, update/remove, over-stock 422; browser add-to-cart + cart page |
| Coupons | PASS (API) / NOT VERIFIED (UI) | Apply/remove, invalid, validate, percentage/fixed caps, expiry, minimum, usage limit tests pass |
| Checkout, server totals, COD, bank transfer | PASS (API) / PARTIAL (UI) | COD/bank-transfer orders, totals, coupon, empty cart, missing address, unauth all tested; checkout page was not driven to completion in a browser |
| Online payment | NOT IMPLEMENTED | Disabled in UI (“coming soon”); API returns 400. Correctly advertised as unavailable |
| Duplicate-submit prevention | PASS | Bank-transfer duplicate submission rejected; one order created |
| Concurrent last-unit purchase | PASS | Workflow D: exactly one success, one 409/422, inventory 0, one order |
| Order history/detail and IDOR protection | PASS | Owner can read; stranger receives not-found/forbidden path; unauth 401 |
| Admin order transitions | PASS (API) | CONFIRMED→SHIPPED→DELIVERED; invalid post-DELIVERED transition 409; cancel restock, sold count and coupon restore; idempotent re-cancel |
| Admin dashboard/data backing | PASS | API test + production-build screenshot shows live counts, low stock, recent customer; labels corrected |
| Admin product create → storefront | PASS (API) / PARTIAL (UI) | Admin creates published product + variant + stock; storefront detail reports availability; admin product UI renders, but create/edit forms not browser-driven |
| Admin inventory list/update | PASS | API contract, low-stock filter and quantity-update tests; browser pagination, filter, save and restore verified |
| Admin product update/delete, categories, collections, coupons, reviews, messages, newsletter, journal, settings | NOT VERIFIED | Routes exist and are code-reviewed; no integration/browser tests executed in this audit |
| RBAC: customer/admin separation | PASS | Customer gets 403 on admin orders/products/dashboard; unauth 401; admin succeeds; single-admin policy tests pass |
| Registration/login/logout/session | PASS | API tests + browser login/reload persistence; duplicate email, weak password, wrong/unknown credentials, rate-limit 429 |
| Password reset | PARTIAL | Hashing/single-use/expiry code reviewed; no SMTP, so email delivery and UI not executed |
| Account page/order history UI | PASS (render) / PARTIAL (actions) | Browser account page screenshot; address/profile mutations not exercised |
| Addresses | NOT VERIFIED | Ownership-scoped CRUD code reviewed; no executed API/browser test |
| Wishlist | PASS | API add/list/remove; page renders; variant passthrough fixed |
| Reviews | NOT VERIFIED | Moderation API/UI exists; no tests executed |
| Contact | PASS (API) | Contact message accepted; page renders |
| Newsletter | PASS (API) | Idempotent subscription and invalid email 422; homepage/footer forms render |
| Journal | PASS (render) / NOT VERIFIED (admin) | Public pages render from database with static fallback; admin article CRUD untested |
| Image upload/media | PARTIAL | Magic-byte validation and storage branches code-reviewed; Blob token absent, no upload executed |
| Email notifications | NOT VERIFIED | SMTP not configured; templates/calls code-reviewed |
| Admin audit logs | NOT VERIFIED | `logAudit` calls exist; no UI/API test |
| Responsive layout | PASS (tested pages) | Home + PDP; 0 px overflow at 375/390/430/768/1024/1280/1440 |
| Accessibility | PARTIAL (improved) | Lighthouse Accessibility 100 on homepage after fixes; full axe sweep/keyboard walkthrough of every page not performed |
| Security headers | PARTIAL | XFO/nosniff/Referrer/Permissions present; CSP/HSTS absent |
| SEO metadata/sitemap/robots | PASS | Lighthouse SEO 100; sitemap/robots routes build |

---

## E. Security report

See `ANILLIEA_SECURITY_AUDIT.md` for the full threat-by-threat analysis. Summary:

### Fixed in this audit

- Checkout authorization/transaction hardening, coupon claim atomicity, admin transition compensation.
- Open redirect, diagnostic leakage, plaintext reset tokens, production JWT fallback, upload magic-byte validation, JSON-LD escaping, coupon-validation rate limit.
- Cookie remains `HttpOnly` + `SameSite=Lax`, with `Secure` on HTTPS/Vercel.
- RBAC and IDOR paths are server-enforced and covered by tests.

### Confirmed open risks

- **Critical:** 7 production dependency advisories (1 critical, 6 high), primarily Next.js 14.2.35. No exploit attempt was made; the advisories include serious RCE/DoS classes and must be remediated.
- **High:** In-memory rate limiting does not protect a scaled deployment.
- **Medium:** Stateless sessions are not revoked on credential change; no CSP/HSTS; no MFA/email verification/admin lockout.
- **Low:** Some malformed IDs produce 500; public coupon validation supports code guessing (rate-limited); expected pre-login 401 console noise.

No Critical or High *application-code* access-control bypass was found after remediation. This is not a claim that the app is vulnerability-free; no external penetration test, fuzzing or production abuse testing was performed.

---

## F. Database report

### Schema and integrity

- 24 models, 7 enums, two committed migrations. No migration was added or applied during this audit, and no schema change was required for the code fixes. **No destructive database operation was run.**
- Primary keys are UUIDs. Foreign keys use `Cascade`, `SetNull` or `Restrict` deliberately; order items reference products with `Restrict` to avoid deleting products referenced by historical orders.
- Unique constraints protect user email, product/variant SKU, category/collection/product/journal slugs, order number, coupon code, cart/user, wishlist/user, payment/order, inventory variant and review (product,user).
- Indexes cover product slug/category/published/createdAt, variant product, inventory product, cart item, wishlist composite, order user/status/number/createdAt, order item, coupon usage, review and article publication fields.
- Money is `Int`; no floating-point currency fields were found.
- Order items preserve the purchased name, variant name, SKU, unit price and subtotal.

### Transactional behavior

- Checkout runs in one `prisma.$transaction`: per-user advisory lock, cart re-read, coupon revalidation/claim, address and shipping resolution, conditional stock decrement, order/items/payment/notification creation, cart clear.
- Stock decrement uses a conditional raw `UPDATE`; if the row was changed by a competing buyer, checkout aborts with 409 rather than overwriting stock.
- Coupon `usedCount` is incremented with a conditional `updateMany`; failure aborts before order creation.
- Admin status transitions use compare-and-set semantics; cancellation/return compensation is applied once, and same-status requests are idempotent.

### Verification performed

- Workflow D (two buyers, one unit): exactly one order; loser 409/422; inventory 0.
- Single-use coupon: first order 201, second rejected with no stock/cart/order side effects; cancellation restores usage.
- Cancel/return: stock, seller `soldCount` and coupon usage restored; repeat cancel returns 200 and does not double-restore.
- API test database (`anilliea_test`) was reset by its provisioning script only; the development/production database was not reset.

### Gaps and safe migration plan

1. **No database-level non-negative check** on `Inventory.quantity/reserved`, `OrderItem.quantity`, `Coupon.usedCount`. Application guards are tested, but defense-in-depth is missing. Safe plan: preflight `SELECT` for negative values; add `CHECK` constraints as `NOT VALID`; validate constraints during a low-traffic window; rollback is dropping only the constraints.
2. **No unique constraint on `(couponId, userId)`** in `CouponUsage`; one-use-per-customer is enforced by checkout and serialized per user. Safe plan: preflight duplicate query; remove/merge duplicates with business approval; add a unique index concurrently, then enforce in code; do not run blindly if historical duplicates exist.
3. **No schema support for session revocation** (`sessionVersion`/`passwordChangedAt`). Safe additive migration with a default value; required for R-03.
4. **Backup/restore readiness is external** and unverified. Enable PITR, test a restore into a separate database, and document RPO/RTO before launch.

No N+1 query benchmark was run; `Prisma` includes are used in the main list/detail paths, but production query plans and slow-query logs were unavailable.

---

## G. API report

Full endpoint inventory and tested/not-tested matrix: `ANILLIEA_API_AUDIT.md`.

Summary:

- **58 route files, 78 handlers.** All were code-reviewed for method, validation, auth, ownership scoping, status codes, response shape and rate limiting.
- Zod validation is used for request bodies and most query parameters. Error handling maps `ApiError`, `ZodError` and Prisma P2002 to 4xx JSON and never returns stacks for unknown errors.
- All admin routes call `requireAdmin`; customer routes call `requireUser`; public catalogue/auth endpoints are intentionally public.
- IDOR: order detail is ownership-filtered; address and wishlist operations filter by the authenticated user; API tests confirm a stranger cannot read another order.
- Mass assignment: routes map validated fields explicitly rather than spreading request bodies into Prisma.
- **53 API integration tests passed**. The tested areas are auth, products, cart/coupons, checkout/orders, admin RBAC/dashboard/inventory, wishlist/newsletter/contact, and workflows A–E.
- **Not executed:** address CRUD, reviews, notifications, public collections, most admin CRUD, password-reset/change-password, upload, journal, messages, audit logs, customers. These are recorded as NOT VERIFIED, not as passing.
- Known gap: malformed non-UUID IDs on many dynamic routes return 500 instead of 404.
- CORS: no cross-origin API policy is enabled, so the API is same-origin by default. If it is exposed to another origin, add an explicit allowlist.

---

## H. Frontend and UX report

### Verified

- Browser smoke against the production build rendered `/`, `/shop`, PDP, `/journal`, `/collections`, `/contact`, `/wishlist`, login, `/account`, `/cart`, `/admin`, `/admin/orders`, `/admin/products`.
- Customer login persisted across a reload; add-to-cart worked after selecting colour and size; cart page listed the product; admin dashboard showed live data.
- All seven required widths showed **0 px horizontal overflow** on the homepage, and the PDP had **0 px** at 375 px.
- No broken images were detected by the browser check on the visited pages.
- Homepage Lighthouse accessibility is now **100** with 0 contrast failures.
- Final homepage and PDP screenshots were visually reviewed after the color/overlay changes; the premium ivory/espresso/taupe/olive identity remains intact.

### Design/brand assessment

The implementation uses the intended palette (`#F5F0E8`, `#2A2521`, `#A69A89`, `#737963`), Cormorant Garamond headings, Inter body text, generous spacing and restrained motion. The storefront reads as a premium modest-fashion brand at both desktop and mobile widths. The product imagery in the seeded data is largely minimalist placeholder artwork, so real photography quality could not be assessed.

### Remaining UX/accessibility work

- Full keyboard-only walkthrough (focus traps, drawer/modal focus return, skip-link verification).
- Automated axe scan on all public/admin pages, not just Lighthouse homepage.
- Checkout page completion, validation/error states and mobile checkout flow were not browser-tested.
- Admin tables/forms were not browser-exercised; loading/empty/error states beyond captured pages remain unverified.
- Some admin `<img>` elements bypass `next/image` (lint warnings). Custom Google Fonts `<link>` is render-blocking (Lighthouse).
- Empty states were observed on the dashboard and wishlist; not every screen was forced into loading/error states.

---

## I. Performance report

Measured locally on the production build (`npm start`) with Lighthouse 12, headless Chrome, mobile default settings:

| Metric | Result |
|---|---|
| Performance | 84 |
| Accessibility | 100 (after fixes) |
| Best Practices | 96 |
| SEO | 100 |
| FCP | 3.3 s |
| LCP | 3.5 s |
| TBT | 60 ms |
| CLS | 0 |
| Speed Index | 3.3 s |

Build output: 87.3 kB shared First Load JS; `/shop` 144 kB, PDP 149 kB, `/cart` 146 kB, `/checkout` 112 kB, `/admin` around 100+ kB (route-specific). Many data-backed pages are dynamic (`ƒ`) because they query PostgreSQL per request; there is no ISR/shared cache configured.

Observed opportunities:

1. Self-host/subset fonts or switch to `next/font` to remove the external render-blocking Google Fonts request (Lighthouse estimated ~1.2 s wasted locally).
2. Reduce legacy JavaScript polyfills in the shared chunk (~11.2 kB reported).
3. Back/forward cache is blocked by `Cache-Control: no-store` on API responses and the page; acceptable for authenticated/dynamic pages, but public catalogue pages could use caching/ISR.
4. Some admin images use `<img>`; convert to `next/image` for LCP/bandwidth.
5. Local lab numbers are not production numbers. Run Lighthouse against the deployed staging URL on a throttled mobile profile before launch.

No load test, database slow-query log, APM trace or CDN measurement was available.

---

## J. Fixes implemented

| Area | Files (primary) | Verification |
|---|---|---|
| Atomic checkout, duplicate-submit protection, coupon claim, stock CAS | `lib/orders/checkout.ts` | 50 API tests incl. workflows A–E; build/typecheck pass |
| Order state machine and cancellation compensation | `lib/orders/status.ts`, `app/api/admin/orders/[id]/route.ts`, admin order UI/types | Workflow B + cancellation/restock tests |
| Open redirect hardening | `app/login/page.tsx` | Typecheck + browser login; dedicated redirect case not automated |
| Session response contract and admin layout | `app/api/auth/me/route.ts`, `lib/auth/session.ts`, `app/admin/layout.tsx`, hooks/client | Auth tests, admin browser journey |
| JWT production secret requirement | `lib/auth/jwt.ts` | Code review + unit JWT tests |
| Password-reset token hashing | `lib/auth/tokens.ts`, forgot/reset routes, `tests/unit/tokens.test.ts` | 3 token tests |
| Diagnostic hardening | `app/api/diag/route.ts`, `app/api/auth/me/route.ts` | Auth test asserts no diagnostics; code review |
| Upload magic-byte checks | `app/api/admin/upload/route.ts` | Code review; runtime NOT VERIFIED (no Blob token) |
| JSON-LD escaping | `lib/utils/json-ld.ts`, `components/shared/JsonLd.tsx`, `tests/unit/json-ld.test.ts` | 2 unit tests |
| Availability and wishlist variant correctness | `lib/catalog/products.ts`, `hooks/useWishlist.tsx`, `app/api/wishlist/route.ts`, wishlist page | Product detail browser; wishlist API tests |
| Email honesty and SMTP handling | `lib/email/index.ts`, forgot-password route | Code review; SMTP NOT VERIFIED |
| Dashboard labels/data semantics | `app/admin/page.tsx` | Dashboard API + screenshot |
| Mobile PDP layout | `ProductPurchase.tsx` | 375 px screenshot, 0 px overflow |
| Accessibility: labels, contrast, overlays, accessible names | UI inputs, Tailwind palette, homepage, ProductCard, footer | Lighthouse 100, contrast failures 0, e2e pass |
| Coupon validation rate limit, newsletter/contact limits | `app/api/coupons/validate/route.ts`, newsletter/contact routes | Code review; login 429 tested, others not |
| Test infrastructure and docs | unit/API/e2e tests, `.eslintrc.json`, `package.json`, README, `.env.example` | All suites run as reported |
| Rebuild after changes | — | `tsc`, unit, API (before UI-only changes), build, e2e all pass |

No business data was deleted, no production database was touched, and no destructive migration was executed.

---

## K. Remaining issues

### Blocked by unavailable services/credentials

- **SMTP:** password-reset and transactional email delivery were not executed. Code path handles missing SMTP honestly (503 in production).
- **Vercel Blob:** upload persistence and `next/image` rendering of Blob URLs were not executed.
- **Online payment gateway:** not integrated (correctly marked “coming soon”); no gateway credentials exist.
- **Production/staging hosting, managed Postgres, backups, monitoring:** not available. Backup restore and deployment rollback are unverified.
- **Real photography:** many seeded images are placeholder editorial artwork; visual quality of final photography cannot be judged.

### Requiring engineering work

- Dependency major upgrade (Next.js critical advisories) and regression testing.
- Distributed rate limiting, session revocation, CSP/HSTS, email verification, admin MFA/lockout.
- Shared UUID validation for dynamic routes.
- Refund/reconciliation workflow and admin operational runbooks.
- CI/CD, staging, observability, backup drill.
- Broader browser tests for checkout, password reset, admin CRUD and error/loading states.
- Full axe/keyboard accessibility audit across all pages.
- Remove the real administrator email from the public template/README defaults.

---

## L. Improvement roadmap

### P0 — before any further real use

1. Upgrade Next.js (and affected transitive packages) in a controlled branch; rerun unit/API/build/e2e, manual checkout/admin smoke, then deploy. The current production dependency audit is 1 critical + 6 high.
2. Confirm production `JWT_SECRET` is strong and unique; enforce HTTPS and add HSTS at the host/CDN.
3. Replace in-memory rate limiting with a shared store or edge/WAF for auth, reset, coupon, contact and newsletter.
4. Freeze demo credentials from production; set a strong admin password; remove the personal email default.
5. Establish a staging environment and a tested database backup/restore procedure before changing production data.

### P1 — required before accepting real orders

1. Configure and test SMTP end-to-end (password reset, order confirmation, bank-transfer instructions).
2. Implement/verify a manual payment confirmation and refund workflow with audit history; reconcile bank transfers.
3. Add session revocation on password change/reset and a short idle timeout for admin sessions.
4. Add CSP (report-only first), verify security headers in the deployed response.
5. Add UUID validation to dynamic routes (404 rather than 500) and automated tests.
6. Add checkout, password-reset and critical admin browser journeys; add CI with typecheck/lint/tests/build.
7. Configure error monitoring, uptime checks and slow-query logging; run a restore drill.
8. Verify Vercel Blob uploads and image rendering in staging.
9. Add DB check constraints for non-negative stock/used counts via safe migrations; consider `(couponId,userId)` uniqueness after duplicate cleanup.

### P2 — important for growth

1. Email verification, admin MFA/TOTP, optional customer MFA.
2. Staff roles beyond the single ADMIN (if needed), with granular permissions and audit trails.
3. Caching/ISR for public catalogue, image optimisation, font self-hosting, bundle trimming.
4. Add load testing and database index review using real query plans.
5. Full accessibility audit and keyboard testing, including checkout and admin.
6. Add analytics/funnel tracking with privacy review.

### P3 — optional enhancements

1. Real online payment integration (cards/mobile wallets) with webhook signature verification and idempotency.
2. International shipping/currency, returns portal, loyalty programme.
3. Rich search (filters, suggestions), recommendation tuning.
4. Automated backup verification reports and chaos/incident exercises.

---

## M. Final readiness assessment

| Dimension | Verdict | Rationale |
|---|---|---|
| Local development readiness | **READY (with setup)** | Build, typecheck, unit/API tests, seeded Postgres, browser smoke and admin dashboard work. SMTP/Blob remain optional/absent. |
| Functional testing readiness | **GOOD / PARTIAL** | Core purchase and admin-order paths have real API + browser coverage. Checkout UI, password reset, most admin CRUD and many error states are not end-to-end verified. |
| Security readiness | **NOT READY** | Critical/high dependency advisories, in-process rate limiting, no session revocation, no CSP/HSTS, no MFA/email verification. Application-level authz and IDOR tests are strong. |
| Staging deployment readiness | **CONDITIONAL** | The app builds and can run against managed Postgres, but no staging environment, CI, SMTP, Blob, backups or monitoring is configured/verified. |
| Production readiness | **NOT READY** | Do not accept live orders until P0 and the core of P1 are complete. COD/bank-transfer processing could be operated manually only with explicit risk acceptance, verified backups and manual email/payment procedures. |

**Bottom line:** the application is a credible, tested foundation with materially improved security and data-integrity behavior. It is not yet safe to operate as a production store. The highest-value next step is a controlled dependency upgrade plus staging/observability/backup setup; the highest-value product step is completing the checkout and admin CRUD browser coverage.
