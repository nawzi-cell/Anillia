# ANILLIÉA — API Audit

**Date:** 2026-10-24  
**Scope:** 58 route files under `app/api/`, 78 HTTP handler functions  
**Method:** source review of every route plus direct handler invocation through the Vitest API harness (real Prisma, isolated `anilliea_test` database), plus browser verification where noted. No HTTP-level fuzzing or production testing was performed.

**Reading the status column**

- **PASS (tested)** — exercised by an automated test and asserted.
- **PARTIAL** — some methods/authorization cases tested; the rest only reviewed.
- **REVIEWED ONLY** — route and guards inspected; no executed test in this audit. Do not read this as working.
- **NOT IMPLEMENTED** — deliberately unavailable end-user capability.

---

## 1. API conventions

| Concern | Implementation |
|---|---|
| Success envelope | `{ success: true, data: ... }` |
| Error envelope | `{ success: false, message, errors? }` |
| Validation | Zod; invalid body generally 422; missing/invalid entity 404; conflicts 409; auth 401; role 403; rate limit 429 |
| Auth cookie | `anilliea_session` JWT, httpOnly, SameSite=Lax, Secure on HTTPS/Vercel, 7 days |
| Route guards | `requireUser()` / `requireAdmin()`; middleware only fast-fails when the cookie is absent |
| Error mapping | `ApiError`, `ZodError`, Prisma P2002 → safe JSON; unknown errors → generic 500, no stack/SQL |
| Ownership | Customer queries filter by authenticated user ID (orders, addresses, cart, wishlist, notifications) |
| Mass assignment | Validated fields are mapped explicitly; request bodies are not spread into Prisma |
| CORS | No permissive CORS headers configured; same-origin default |
| Upload | Admin only; MIME + magic-byte + 5 MB + random filename |

---

## 2. Complete endpoint inventory

Legend for “Executed”: the cases actually asserted in this audit.

### 2.1 Authentication and diagnostics

| Method & path | Auth | Validation | Executed result | Status |
|---|---|---|---|---|
| POST `/api/auth/register` | Public | name 2–80, normalized email, password 8–128 | 201 + cookie; duplicate 409; weak password 422; rate limit 429 | PASS |
| POST `/api/auth/login` | Public | email/password | 200 + cookie; wrong password 401; unknown email 401; repeated attempts 429 | PASS |
| POST `/api/auth/logout` | Public (cookie clear) | none | Session cookie cleared | PASS |
| GET `/api/auth/me` | Customer | none | 401 plain envelope without diagnostics; 200 `{ user }` with cookie, no password hash | PASS |
| PUT `/api/auth/me` | Customer | profile name/phone | Not executed | REVIEWED ONLY |
| POST `/api/auth/change-password` | Customer | current + new password | Not executed; no session revocation | REVIEWED ONLY |
| POST `/api/auth/forgot-password` | Public | email; 5/hour/IP | Not executed (no SMTP); generic message and production 503 reviewed | REVIEWED ONLY |
| POST `/api/auth/reset-password` | Public | token + password; 10/hour/IP | Not executed (no SMTP); hashed token lookup reviewed | REVIEWED ONLY |
| GET `/api/diag` | Production: Bearer `DIAG_TOKEN`; dev: open when unset | none | Not executed; token gating/count-only response reviewed | REVIEWED ONLY |

### 2.2 Public catalogue and marketing

| Method & path | Auth | Validation | Executed result | Status |
|---|---|---|---|---|
| GET `/api/products` | Public | category/collection/search/sort/page/limit | List and pagination metadata; page/limit; name search | PASS (filters partially) |
| GET `/api/products/[slug]` | Public | slug | Detail with variants/availability; unknown slug 404 | PASS |
| GET `/api/categories` | Public | — | Active category list | PASS |
| GET `/api/collections` | Public | — | Not executed | REVIEWED ONLY |
| GET `/api/collections/[slug]` | Public | slug | Not executed | REVIEWED ONLY |
| POST `/api/coupons/validate` | Public | code/subtotal; 30/min/IP | Valid code; invalid code | PASS |
| POST `/api/newsletter` | Public | email; 5/hour/IP | Idempotent subscribe; invalid email 422 | PASS |
| POST `/api/contact` | Public | name/email/phone/message; 5/min/IP | Message accepted | PASS |
| GET `/api/reviews` | Public | productId/pagination | Not executed | REVIEWED ONLY |
| POST `/api/reviews` | Customer | productId/rating/comment; purchase check | Not executed | REVIEWED ONLY |

### 2.3 Customer cart, checkout, orders and account

| Method & path | Auth | Validation | Executed result | Status |
|---|---|---|---|---|
| GET `/api/cart` | Customer | — | Accessed after failed checkout; totals/items | PASS |
| POST `/api/cart/items` | Customer | product/variant/quantity; stock | Add, re-add increments; over-stock 422 | PASS |
| PUT `/api/cart/items/[id]` | Customer | quantity/ownership | Update quantity | PASS |
| DELETE `/api/cart/items/[id]` | Customer | ownership | Remove item | PASS |
| POST `/api/cart/coupon` | Customer | code; cart ownership | WELCOME10 applied | PASS |
| DELETE `/api/cart/coupon` | Customer | — | Coupon removed | PASS |
| POST `/api/checkout` | Customer | address/delivery/payment/coupon | COD 201, stock decrement, cart clear; coupon totals; empty 400; missing address 422; unauth 401; bank transfer; duplicate 400; ONLINE 400; concurrency | PASS |
| GET `/api/orders` | Customer | pagination | Not directly asserted (detail asserted) | REVIEWED ONLY |
| GET `/api/orders/[id]` | Customer | UUID/ownership | Owner 200; stranger not exposed; unauth 401 | PASS |
| GET `/api/addresses` | Customer | — | Not executed | REVIEWED ONLY |
| POST `/api/addresses` | Customer | address schema; default reassignment | Not executed | REVIEWED ONLY |
| PUT `/api/addresses/[id]` | Customer | ownership + address schema | Not executed | REVIEWED ONLY |
| DELETE `/api/addresses/[id]` | Customer | ownership; default reassignment | Not executed | REVIEWED ONLY |
| GET `/api/wishlist` | Customer | — | 401 unauth; list after add | PASS |
| POST `/api/wishlist` | Customer | productId UUID/variant | Add | PASS |
| DELETE `/api/wishlist/[productId]` | Customer | ownership | Remove | PASS |
| GET `/api/notifications` | Customer | pagination | Not executed | REVIEWED ONLY |
| POST `/api/notifications/read` | Customer | IDs array | Not executed | REVIEWED ONLY |

### 2.4 Admin — authentication, dashboard and catalogue

All admin endpoints call `requireAdmin`; customer and unauthenticated denial is asserted for the main groups.

| Method & path | Executed result | Status |
|---|---|---|
| GET `/api/admin/dashboard` | Admin 200; customer 403; live aggregates; browser screenshot | PASS |
| GET `/api/admin/products` | Customer 403; admin list not asserted | PARTIAL |
| POST `/api/admin/products` | Admin 201 with variants/images/collections/inventory; public availability 5 | PASS |
| GET `/api/admin/products/[id]` | Not executed | REVIEWED ONLY |
| PUT `/api/admin/products/[id]` | Not executed | REVIEWED ONLY |
| DELETE `/api/admin/products/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/inventory` | Admin 200 paginated rows with `sku`/`isLow`/`lowStockCount`; customer 403; browser table renders | PASS |
| PUT `/api/admin/inventory/[id]` | Admin 200 quantity update; customer 403; browser save verified | PASS |
| POST `/api/admin/categories` | Not executed | REVIEWED ONLY |
| PUT `/api/admin/categories/[id]` | Not executed | REVIEWED ONLY |
| DELETE `/api/admin/categories/[id]` | Not executed | REVIEWED ONLY |
| POST `/api/admin/collections` | Not executed | REVIEWED ONLY |
| PUT `/api/admin/collections/[id]` | Not executed | REVIEWED ONLY |
| DELETE `/api/admin/collections/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/coupons` | Not executed | REVIEWED ONLY |
| POST `/api/admin/coupons` | Created a single-use coupon in workflow test | PASS |
| PUT `/api/admin/coupons/[id]` | Not executed | REVIEWED ONLY |
| DELETE `/api/admin/coupons/[id]` | Not executed | REVIEWED ONLY |
| POST `/api/admin/upload` | Not executed (no Blob token); validation reviewed | REVIEWED ONLY |
| GET `/api/admin/journal` | Not executed | REVIEWED ONLY |
| POST `/api/admin/journal` | Not executed | REVIEWED ONLY |
| GET/PUT/DELETE `/api/admin/journal/[id]` | Not executed | REVIEWED ONLY |

### 2.5 Admin — orders, customers, staff and operations

| Method & path | Executed result | Status |
|---|---|---|
| GET `/api/admin/orders` | Customer 403; admin success not asserted | PARTIAL |
| GET `/api/admin/orders/[id]` | Not directly asserted | REVIEWED ONLY |
| PUT `/api/admin/orders/[id]` | CONFIRMED→SHIPPED→DELIVERED 200; invalid transition 409; cancel restores stock/sold count/coupon; repeat cancel 200; UUID guard reviewed | PASS |
| GET `/api/admin/customers` | Not executed | REVIEWED ONLY |
| GET `/api/admin/customers/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/users` | Admin 200; customer 403; unauth 401 | PASS |
| PATCH `/api/admin/users/[id]` | Single-admin policy; self-role guard; unknown user 404 | PASS |
| POST `/api/admin/change-email` | Valid password change; wrong password rejected | PASS |
| GET `/api/admin/reviews` | Not executed | REVIEWED ONLY |
| PUT/DELETE `/api/admin/reviews/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/messages` | Not executed | REVIEWED ONLY |
| PUT/DELETE `/api/admin/messages/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/newsletter` | Not executed | REVIEWED ONLY |
| DELETE `/api/admin/newsletter/[id]` | Not executed | REVIEWED ONLY |
| GET `/api/admin/audit-logs` | Not executed | REVIEWED ONLY |

---

## 3. Authorization and IDOR results

| Scenario | Result |
|---|---|
| Logged-out admin API | 401 |
| Customer → admin dashboard/products/orders | 403 for all three; admin layout redirects to login |
| Customer reads another customer's order | Not exposed (not-found/forbidden path asserted) |
| Customer address/wishlist/cart/notification operations | Code filters by authenticated user; wishlist tested, others reviewed |
| Admin self-demotion / second ADMIN creation | Blocked by tested single-admin policy |
| Expired/tampered JWT | `verifyToken` returns null (unit tests); protected request becomes 401 |
| Role from JWT used without DB check | No: `getCurrentUser` reloads the user/role from DB |

No mass-assignment path was found in reviewed routes: bodies are Zod-parsed and fields explicitly selected. This is a code-review finding, not an exhaustive dynamic test of all 78 handlers.

## 4. Validation, status codes and error behavior

- Body/query validation is broadly consistent. `ZodError` → 422; missing entity → 404; duplicate key → 409; unauthorized → 401; forbidden → 403; conflict (stock/status) → 409; unavailable feature → 400.
- The checkout tests assert no side effects on validation/payment failure, not merely the status code.
- Unknown errors return a generic 500 and never a stack; verified by reading `lib/api/errors.ts`, not by forcing every database failure.
- Malformed JSON syntax is not specifically wrapped; a direct `req.json()` SyntaxError may become a 500. **Not executed, recommended fix:** shared safe JSON parse → 400.
- Malformed non-UUID path IDs: only `/api/admin/orders/[id]` validates the UUID. Other dynamic routes can reach Prisma and produce 500/P2023. **Not executed; recommended fix:** shared UUID param guard → 404.
- Pagination limits are bounded in catalogue/admin list schemas (reviewed); response metadata exists for products.
- There is no API versioning or idempotency-key mechanism; duplicate checkout is prevented by cart clearing and the per-user transaction rather than an explicit request key.

## 5. Rate limiting

| Endpoint | Limit | Tested |
|---|---|---|
| Login | 10/min/IP | Yes (429) |
| Register | 10/min/IP | No |
| Forgot password | 5/hour/IP | No |
| Reset password | 10/hour/IP | No |
| Contact | 5/min/IP | No |
| Newsletter | 5/hour/IP | No |
| Coupon validate | 30/min/IP | No |

All use the in-memory fixed-window limiter in `lib/utils/rate-limit.ts`. It resets on process restart and is not shared across instances; treat it as a development/single-instance safeguard only. IP comes from the request headers; a trusted proxy configuration is required to prevent spoofed `x-forwarded-for`.

## 6. Data exposure and sensitive fields

- `toUserDTO`/explicit Prisma selects omit `passwordHash`, reset tokens and verification tokens from session/user responses.
- `/api/auth/me` tests assert no `passwordHash` and no diagnostic block.
- `/api/diag` returns env-presence booleans, DB reachability and counts; no connection strings or error dumps. Production requires a Bearer token.
- Admin customer/user responses were reviewed for field selection but not executed; no evidence of password-hash exposure was found in code.
- Error responses do not echo SQL or stack traces for unknown errors.
- API responses include internal IDs (UUIDs), stock counts and order details only to the authorized owner/admin. No public endpoint was found exposing customer lists.

## 7. File upload

`POST /api/admin/upload`:

- Requires `ADMIN`.
- Accepts one `file`, max 5 MB.
- Allows only JPEG/PNG/WebP/GIF and verifies magic bytes.
- Uses a random UUID filename, ignoring the client filename.
- Uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` exists; otherwise local `public/uploads/` (development only).
- Public Blob access; no virus/malware scanning, image re-encoding or content-disarm. Not verified at runtime in this audit.

## 8. Findings and required fixes

| ID | Severity | Finding | Required fix |
|---|---|---|---|
| API-01 | High | Many dynamic-ID routes do not validate UUID format; malformed IDs can become 500 | Shared `uuidParam` helper → 404 (or map P2023) |
| API-02 | Medium | Malformed JSON body may become 500 rather than 400 | Safe JSON parse helper |
| API-03 | Medium | Rate limiter is single-instance only | Shared Redis/WAF limiter |
| API-04 | Low | Public coupon validation enables code guessing (rate-limited 30/min) | Keep limit; consider CAPTCHA or requiring authentication for repeated attempts |
| API-05 | Low | No explicit API-level idempotency key for checkout | Current cart-clear/transaction defense is adequate for normal retries; add key if a future mobile/client retry model needs it |
| API-06 | Low | API coverage is uneven: many admin CRUD routes reviewed but not executed | Add contract tests for each admin route and permissions; keep the matrix updated |
| API-07 | Low | No CORS allowlist (same-origin default) | Add explicit allowlist only if a separate frontend/API origin is introduced |

## 9. Test harness notes

- API tests import route handlers directly, set a test cookie through the login helper, and use a real PostgreSQL database; they do not start an HTTP server. This exercises Prisma, validation, auth and business logic, but not network/proxy behavior, TLS, cookie parsing by a browser, or CDN headers.
- The browser smoke test covers the HTTP/browser path for login, cart and admin dashboard, but not every API.
- API results are therefore strong evidence for handler behavior and data integrity, not a substitute for a deployed staging smoke test.

## 10. Summary

The API is consistently structured, Zod-validated and server-authorized. The critical commerce endpoints (checkout, stock, coupon, order transitions) now have real integration coverage and pass. The main API risks are operational (distributed rate limiting, malformed-ID/JSON behavior) and coverage gaps in admin CRUD routes, not a confirmed authorization bypass. Production acceptance should require the P1 items in the main audit report and a staging smoke suite over the untested endpoints.
