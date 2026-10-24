# ANILLIÉA — Test Plan and Execution Record

**Version:** 1.0  
**Date:** 2026-10-24  
**Application:** ANILLIÉA (Next.js 14.2.35 / Prisma 5.22 / PostgreSQL 16)  
**Test environment:** Local Windows 11 workstation, Node 24.18.0, Docker PostgreSQL 16, local Google Chrome.  
**Production/staging:** none available; no production data was used.

---

## 1. Objectives

1. Establish what actually works in the storefront, API, admin panel and database.
2. Verify critical customer and admin journeys, including authorization and concurrency.
3. Protect existing data: all mutating tests run against a dedicated `anilliea_test` database.
4. Re-run checks after fixes and report only executed results.
5. Record coverage gaps so “not tested” is never presented as “working”.

## 2. Scope

In scope:

- TypeScript, lint, production build, dependency state.
- Unit logic: pricing, coupons, stock checks, authz, JWT, password hashing, token hashing, JSON-LD escaping.
- API integration: auth, products, cart, coupons, checkout, orders, RBAC, admin dashboard, wishlist, newsletter, contact, workflows A–E, coupon limits, cancellation/restock.
- Browser smoke: storefront pages, responsive widths, login persistence, add-to-cart, cart page, admin dashboard/orders/products.
- Accessibility/performance baseline via Lighthouse.
- Security review of auth, authorization, uploads, headers, secrets, dependencies.

Out of scope / unavailable:

- Real SMTP delivery, Vercel Blob persistence, live card/mobile-wallet payment, production hosting, managed Postgres, backups, CDN, WAF, error monitoring.
- Destructive security testing against production; load testing; penetration testing; fuzzing every endpoint.
- Pixel-perfect visual comparison against a design file (none supplied).
- Every button/form/admin CRUD screen (recorded as gaps).

## 3. Environment and data isolation

| Item | Value |
|---|---|
| App URL | `http://localhost:3000` (dev server for earlier runs; production `npm start` for final E2E/Lighthouse) |
| Unit tests | No database required |
| API database | `anilliea_test` (provisioning script resets only this database) |
| Development database | `anilliea` (seed data; used only for browser smoke) |
| Browser | Local Chrome via `playwright-core`; no browser download |
| Screenshots | `tests/e2e/artifacts/` (gitignored) |
| Seed accounts | Admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; demo customer `customer@example.com`/`DEMO_PASSWORD`; secrets not printed |

Safety controls:

- `TEST_DATABASE_URL` is separate from `DATABASE_URL`.
- The provisioning script drops/recreates only the isolated test schema/database.
- No `prisma migrate dev`, `db push` or reset was run against the development or a production database.
- No secrets, cookies, password hashes or customer records are included in test output or this plan.

## 4. Test levels and commands

| Level | Command | Current result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Lint | `npm run lint` | PASS, 0 errors, 5 warnings |
| Unit | `npm test` | **9 files, 54 tests passed** |
| API integration | `npm run test:api` | **7 files, 53 tests passed** |
| Production build | `npm run build` | Compiled successfully |
| Browser smoke | `npm run test:e2e` against `npm start` | All browser checks passed |
| Lighthouse | `npx lighthouse@12 … --only-categories=performance,accessibility,best-practices,seo` | Perf 84, A11y 100, BP 96, SEO 100 |

Exact final browser output:

```
Admin-context 401 response paths: /api/auth/me

Responsive sweep:
  / @375px — overflow 0px
  / @390px — overflow 0px
  / @430px — overflow 0px
  / @768px — overflow 0px
  / @1024px — overflow 0px
  / @1280px — overflow 0px
  / @1440px — overflow 0px
  /product/:slug @375px — overflow 0px

Console/page errors: 1 (plus 32 expected logged-out 401s)
  • [admin] Failed to load resource: the server responded with a status of 401 (Unauthorized)

All browser checks passed.
```

The single admin-context 401 was captured as `/api/auth/me` during the logged-out login-page probe. It is expected probe noise, not a failed admin API; the dashboard rendered live data.

## 5. Unit test inventory (54)

| File | Count | Coverage |
|---|---:|---|
| `tests/unit/authz.test.ts` | 5 | `assertRole` 401/403/pass and runtime mismatch |
| `tests/unit/checkout-inventory.test.ts` | 6 | stock sufficiency, exact stock, shortfall reporting, zero, multiple shortages, empty |
| `tests/unit/coupon.test.ts` | 10 | percentage/fixed math, caps, inactive/expired/future, minimum, usage limit, null |
| `tests/unit/format.test.ts` | 7 | PKR formatting, zero, slugify variants |
| `tests/unit/jwt.test.ts` | 5 | round-trip, admin payload, garbage, tampered, expired |
| `tests/unit/password.test.ts` | 6 | bcrypt hash/verify, salt uniqueness, bad hash |
| `tests/unit/pricing.test.ts` | 7 | subtotal, discount, totals, delivery fees, free threshold, integers, empty |
| `tests/unit/tokens.test.ts` | 3 | stable SHA-256, no raw token, different digests |
| `tests/unit/json-ld.test.ts` | 2 | round-trip and `</script>` escaping |

## 6. API integration test inventory (53)

| File | Tests | Coverage |
|---|---:|---|
| `tests/api/auth.test.ts` | 11 | register, duplicate, weak password, login success/wrong/unknown, 429 rate limit, `/me` no diagnostics, session cookie, logout |
| `tests/api/products.test.ts` | 6 | list/pagination/search, detail with variants, 404, categories |
| `tests/api/cart.test.ts` | 8 | 401, add/re-add, stock limit 422, update/remove, apply/remove coupon, invalid coupon, public validate |
| `tests/api/checkout.test.ts` | 7 | COD order 201/stock decrement/cart clear, coupon totals, empty cart, missing address, 401, order detail owner vs stranger |
| `tests/api/admin.test.ts` | 11 | admin access, customer 403, unauth 401, dashboard, inventory pagination/sku/isLow contract, low-stock filter/count, quantity update, single-admin enforcement, self-role guard, email change, unknown user |
| `tests/api/misc.test.ts` | 5 | wishlist 401/add/list/remove, newsletter idempotent/invalid, contact |
| `tests/api/workflows.test.ts` | 7 | workflows A–E, coupon usage limit, cancellation/restock/idempotent re-cancel |

### Workflow A — registration → cart → checkout

**Test:** `places a bank-transfer order and blocks duplicate submission`.

Steps: register via API → login → pick a seeded stocked variant → add to cart → checkout with bank transfer/standard delivery → assert order 201, payment provider `bank_transfer`, status `PENDING`, non-empty instructions → submit again → assert 400 and exactly one order.

**Result: PASS.** Bank-transfer instructions come from configured bank env vars or a safe contact-for-details fallback; auto-verification is not implied.

### Workflow B — admin product → storefront → fulfilment

**Test:** `creates a product in admin, sells it, and advances it to delivered`.

Steps: admin login → `POST /api/admin/products` (published, variant qty 5) → public product detail shows `available: 5` → customer buys 2 with express delivery → delivery fee 450 → admin transitions CONFIRMED → SHIPPED → DELIVERED → invalid transition after DELIVERED returns 409 → at least 2 notifications.

**Result: PASS.**

### Workflow C — customer blocked from admin APIs

**Test:** customer calls `/api/admin/orders`, `/api/admin/products`, `/api/admin/dashboard`.

**Result: PASS.** All three return 403. Unauthenticated admin access returns 401 in the auth/admin tests.

### Workflow D — concurrent last-unit checkout

**Test:** two separately registered customers each have one unit of a stock-1 product; both call `createOrder` simultaneously.

**Result: PASS.** Exactly one fulfilled, one rejected with `ApiError` status 409 or 422; inventory ends at 0; exactly one order exists.

### Workflow E — failed checkout leaves no side effects

**Tests:** invalid coupon; ONLINE payment.

**Result: PASS.** Both return 400; stock unchanged; cart still contains the item; zero orders created.

### Coupon/cancellation regression

**Test:** admin creates a single-use percentage coupon; customer 1 succeeds; customer 2 is rejected; admin cancels the order; stock, sold count, coupon `usedCount` and usage are restored; repeat cancellation returns 200 without double-restoring.

**Result: PASS.** Same-status cancellation is an intentional idempotent no-op after the first compensation.

## 7. Browser/E2E coverage

`tests/e2e/smoke.mjs` (Playwright-Core + local Chrome):

| Check | Result |
|---|---|
| Homepage at 375/390/430/768/1024/1280/1440 | PASS, 0 px overflow |
| `/shop`, PDP, `/journal`, `/collections`, `/contact`, `/wishlist` HTTP/content/images | PASS |
| PDP at 375 px | PASS, 0 px overflow, CTA layout reviewed |
| Customer login and session persistence across reload (`/account`) | PASS |
| Select colour + size, add to bag, cart badge, cart page content | PASS |
| Cart cleanup through API | PASS |
| Admin login; `/admin`, `/admin/orders`, `/admin/products` | PASS; dashboard shows live counts/low stock |
| Broken images | None detected on visited pages |
| Unexpected console/page errors | 0; 1 expected pre-login `/api/auth/me` 401 probe + 32 expected logged-out 401 probes |
| Screenshots | Home 375/768/1440, PDP 375, cart, account, admin dashboard/orders/products, shop, journal, collections, contact, wishlist |

## 8. Responsive/accessibility/performance results

- Responsive overflow: **0 px** at all seven required widths for homepage; **0 px** for PDP at 375 px.
- Lighthouse accessibility: **100** after fixing 41 contrast failures and one accessible-name mismatch. The original score was 96. Final contrast failures: **0**.
- Performance (local lab, mobile): **84**, FCP 3.3 s, LCP 3.5 s, TBT 60 ms, CLS 0, Speed Index 3.3 s.
- SEO: **100**; Best Practices: **96** (remaining difference is primarily expected logged-out 401 console errors).
- Keyboard-only testing and full-page axe scans are **NOT DONE**.

## 9. Security test coverage

Executed:

- Unauthenticated and customer-vs-admin authorization: 401/403 assertions.
- IDOR on order detail: owner vs stranger.
- Login rate limit: 429 after repeated attempts.
- Generic unknown-email login failure (no user enumeration in response).
- Session token round-trip, tamper, expiry; reset-token SHA-256 tests.
- Safe 401 shape assertion (no diagnostics).
- Dependency audit (read-only): 1 critical + 6 high production advisories.
- Code review of upload validation, reset flow, JSON-LD escaping, security headers, cookie flags.

Not executed:

- External penetration test, fuzzing, CSRF browser simulations, SQL injection payload suite, file-upload runtime (no Blob token), distributed rate-limit test, session-revocation test (not implemented).

## 10. Defects found and verified fixed

| Defect | Verification |
|---|---|
| Oversell/duplicate checkout under concurrency | Workflow D + duplicate-submit test |
| Coupon usage limit race / cancellation restoration | Coupon/cancellation workflow test |
| Open redirect in login | Code review + login E2E; bypass not separately automated |
| Reset tokens stored plaintext | 3 unit tests |
| JSON-LD `</script>` injection | 2 unit tests |
| Admin dashboard misleading order-value label | Dashboard API + screenshot |
| Mobile PDP wrapping | 375 px screenshot, 0 px overflow |
| 41 contrast failures + accessible-name mismatch | Lighthouse 100, contrast 0 |
| Session contract/admin bounce, availability, wishlist variants, uploads, email honesty | See audit report §C/J; tested where service access allowed |

## 11. Blocked / not executed tests

| Area | Why blocked | Safe alternative used |
|---|---|---|
| SMTP reset/order emails | No SMTP credentials | Code review; production 503 behavior verified by reading; local console fallback |
| Vercel Blob uploads | No Blob token | Magic-byte validation reviewed; local storage path inspected, not executed |
| Online card/wallet payment | No gateway integrated | Verified disabled UI and API 400; no fake success claims |
| Production DB/backups | No access | Used isolated local Postgres; documented migration/restore plan |
| Deployed performance | No staging/production access | Local production-build Lighthouse baseline |
| Full admin CRUD UI | Time/scope | Code review; only create-product API and page renders verified |
| Checkout UI completion | Test data mutation in dev DB avoided | API-level full checkout verified |

## 12. Exit criteria and rerun instructions

A build is acceptable for this audit when:

- `npx tsc --noEmit`, `npm test`, `npm run test:api`, `npm run build` and `npm run lint` (no errors) pass.
- Browser smoke exits 0 with no unexpected console/page errors.
- No new unclassified high/critical security issue is introduced.
- Known gaps remain documented.

Reproduce:

```bash
# Isolated API tests (Postgres 16 running)
npm run test:api

# Unit tests
npm test

# Production build
npm run build

# Browser smoke (one terminal)
npm start                # or npm run dev
# second terminal
npm run test:e2e

# Lighthouse (server must be running)
npx lighthouse@12 http://localhost:3000/ \
  --chrome-path="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=.lighthouse-home.json
```

CI should run the first four commands and browser smoke against an ephemeral seeded database; Lighthouse is a release-stage check, not a unit gate.
