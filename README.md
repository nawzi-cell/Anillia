# ANILLIÉA

**ANILLIÉA** is a premium modest-fashion e-commerce platform — hijabs, underscarves, niqabs, accessories and curated gift bundles, sold in PKR to customers across Pakistan. Built with Next.js 14, Prisma 5 + PostgreSQL, and TypeScript (strict).

> **Status:** under active development by a small team. The storefront, API routes and backend library modules are being built in parallel — this README is the shared contract. Anything marked as planned is not yet implemented.

---

## Features

- **Storefront** — product catalogue with categories, collections, search, sort and filters; product detail pages with color/size variants and image galleries
- **Cart & checkout** — signed-in cart, coupon codes, delivery method choice (Standard / Express), COD and bank-transfer payment
- **Accounts** — email/password auth with JWT sessions, password reset (email delivery requires SMTP), saved addresses
- **Orders** — order history, status tracking with an enforced transition flow, atomic stock decrement at checkout, stock restore on cancellation/return, low-stock signals
- **Journal** — database-backed articles when published in admin, with a bundled static fallback
- **Reviews** — moderated product reviews (pending / approved / hidden)
- **Admin panel** — manage products, variants, inventory, categories, collections, coupons, orders and users
- **Coupons** — percentage and fixed-amount coupons with minimum order, max discount, usage limits and expiry windows

---

## Tech stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | Next.js 14 (App Router, React 18)   |
| Language   | TypeScript 5 (strict)               |
| Database   | PostgreSQL 16 via Prisma 5          |
| Auth       | JWT (`jsonwebtoken`) + `bcryptjs`   |
| Styling    | Tailwind CSS 3                      |
| Motion     | Framer Motion, lucide-react icons   |
| Validation | Zod                                 |
| Tests      | Vitest 2                            |
| Dev DB     | Docker Compose (postgres:16-alpine) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 14 app                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Storefront  │  │ Admin panel  │  │  API routes        │   │
│  │  (RSC +      │  │ (/admin)     │  │  (/api/...)        │   │
│  │   client UI) │  │             │  │                    │   │
│  └──────┬───────┘  └──────┬──────┘  └─────────┬──────────┘   │
│         └────────────────┼───────────────────┘              │
│                    lib/ (auth, coupons, orders, email…)      │
│                              │                               │
│                        Prisma Client                         │
└──────────────────────────────┼───────────────────────────────┘
                               │ SQL
                    ┌──────────▼──────────┐
                    │  PostgreSQL 16      │
                    │  (docker-compose /  │
                    │   managed Postgres) │
                    └─────────────────────┘
```

- **App Router** renders the storefront (React Server Components) and hosts API routes under `app/api/`.
- **`lib/`** holds framework-free domain logic (pricing, coupons, auth, inventory) — unit-tested with Vitest.
- **`prisma/`** holds the schema, migrations and the idempotent seed script.
- Auth is JWT-based: `lib/auth/jwt` signs tokens, `lib/auth/session` guards routes (`assertRole`).

---

## Prerequisites

- Node.js ≥ 18.18 (see `engines` in `package.json`)
- npm
- Docker + Docker Compose (for the local Postgres; optional if you have your own Postgres 16)

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp .env.example .env
# then edit .env — at minimum set ADMIN_PASSWORD and DEMO_PASSWORD,
# and generate a JWT_SECRET:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Create the database schema
npx prisma migrate dev

# 5. Seed demo data (admin user, demo customer, catalogue, coupons)
npx prisma db seed

# 6. Run the dev server
npm run dev
# → http://localhost:3000
```

---

## Environment variables

| Variable              | Required | Default / example                              | Purpose                                              |
| --------------------- | -------- | ---------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | yes      | `postgresql://anilliea:anilliea@localhost:5432/anilliea?schema=public` | Prisma connection string |
| `JWT_SECRET`          | yes      | _(min 32 random chars)_                         | Signs/verifies JWT session tokens                    |
| `NEXT_PUBLIC_APP_URL` | yes      | `http://localhost:3000`                         | Canonical app URL (links in emails, metadata)        |
| `ADMIN_EMAIL`         | no       | `nawzirahmed4@gmail.com`                        | Email for the seeded admin (owner) account           |
| `ADMIN_PASSWORD`      | yes (seed) | —                                              | Password for the seeded admin user                   |
| `DEMO_PASSWORD`       | yes (seed) | —                                              | Password for the seeded demo customer                |
| `SMTP_HOST`           | no       | —                                               | SMTP host for transactional email                    |
| `SMTP_PORT`           | no       | `587`                                           | SMTP port                                            |
| `SMTP_USER`           | no       | —                                               | SMTP username                                        |
| `SMTP_PASSWORD`       | no       | —                                               | SMTP password                                        |
| `SMTP_FROM`           | no       | `ANILLIÉA <hello@anilliea.pk>`                  | From address for transactional email                 |
| `BANK_NAME`           | no       | —                                               | Shown at checkout for bank-transfer orders           |
| `BANK_ACCOUNT_TITLE`  | no       | —                                               | Shown at checkout for bank-transfer orders           |
| `BANK_ACCOUNT_NUMBER` | no       | —                                               | Shown at checkout for bank-transfer orders           |
| `BANK_IBAN`           | no       | —                                               | Shown at checkout for bank-transfer orders           |
| `PAYMENT_SECRET`      | no       | —                                               | Reserved for payment callbacks once an online gateway is integrated |
| `BLOB_READ_WRITE_TOKEN` | no     | —                                               | Vercel Blob token for persistent admin image uploads |
| `DIAG_TOKEN`          | no       | —                                               | Enables authenticated `/api/diag` in production (`Bearer` token) |

---

## Database: migrations & seeding

```bash
npx prisma migrate dev        # create/apply a migration in development
npx prisma migrate deploy     # apply pending migrations (production)
npx prisma generate           # regenerate the Prisma Client
npx prisma db seed            # idempotent seed (safe to re-run)
npx prisma studio             # visual DB browser
```

**Seed contents** (`prisma/seed.ts`, idempotent via upserts):

- Admin user — `ADMIN_EMAIL` / `ADMIN_PASSWORD` (role `ADMIN`, verified)
- Demo customer — `customer@example.com` / `DEMO_PASSWORD` (role `CUSTOMER`, verified) with one default home address in Karachi
- 7 categories (`modest-essentials`, `hijabs`, `underscarves`, `niqabs`, `accessories`, `gift-sets`, `deals`)
- 3 collections (`everyday-edit`, `signature-bundles`, `gift-edit`)
- 8 published products with variants, images and per-variant inventory (including a low-stock demo: 4 units of the black Crinkle Georgette Hijab against a threshold of 10)
- 3 coupons: `WELCOME10` (10% off, min 1500), `FLAT500` (PKR 500 off, min 3000), `BUNDLE20` (20% off, min 5000)

No orders or reviews are seeded — the demo shop stays clean. The seed requires `ADMIN_PASSWORD` and `DEMO_PASSWORD` and throws a clear error if either is missing.

---

## Running

```bash
npm run dev     # development server (http://localhost:3000)
npm run build   # production build (runs `prisma generate` first)
npm start       # serve the production build
npm test        # run the Vitest suite once
npm run test:watch  # watch mode
```

---

## API reference

> Contract for the API routes (implemented by the API engineer). All routes live under `app/api/` and return JSON. Auth: **Public** = no token; **Customer** = valid JWT; **Admin** = JWT with `ADMIN` role.

### Auth

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| POST   | `/api/auth/register`               | Public   | Create account, set session cookie |
| POST   | `/api/auth/login`                  | Public   | Email/password → JWT session       |
| POST   | `/api/auth/logout`                 | Public   | Clear the session cookie           |
| GET    | `/api/auth/me`                     | Customer | `{ user }` for the session user     |
| PUT    | `/api/auth/me`                     | Customer | Update name/phone                  |
| POST   | `/api/auth/forgot-password`        | Public   | Send password-reset email (503 in production without SMTP) |
| POST   | `/api/auth/reset-password`         | Public   | Reset password with a single-use token |
| POST   | `/api/auth/change-password`        | Customer | Change password with current password |

> Email verification is **not implemented** (`emailVerified` exists on the schema but login does not require it). Do not advertise it.

### Catalogue

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/products`                    | Public   | List (category, collection, search, sort, pagination) |
| GET    | `/api/products/[slug]`             | Public   | Product detail with variants       |
| GET    | `/api/categories`                  | Public   | Active categories                  |
| GET    | `/api/collections`                 | Public   | Active collections                 |

### Cart & checkout

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/cart`                        | Customer | Current cart with server totals     |
| POST   | `/api/cart/items`                  | Customer | Add item (stock-checked)           |
| PUT    | `/api/cart/items/[id]`             | Customer | Update quantity                    |
| DELETE | `/api/cart/items/[id]`             | Customer | Remove item                        |
| POST   | `/api/coupons/validate`            | Public   | Validate a code and preview discount |
| POST   | `/api/checkout`                    | Customer | Atomically create order and decrement stock |

### Orders & account

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/orders`                      | Customer | Own order history                  |
| GET    | `/api/orders/[id]`                 | Customer | Own order detail                   |
| GET    | `/api/addresses`                   | Customer | Saved addresses                    |
| POST   | `/api/addresses`                   | Customer | Add address                        |
| PUT    | `/api/addresses/[id]`              | Customer | Update address                     |
| DELETE | `/api/addresses/[id]`              | Customer | Delete address                      |
| POST   | `/api/reviews`                     | Customer | Submit review (→ PENDING moderation)|

### Admin

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/admin/products`              | Admin    | List all products                  |
| POST   | `/api/admin/products`              | Admin    | Create product                     |
| PUT    | `/api/admin/products/[id]`         | Admin    | Update product                     |
| DELETE | `/api/admin/products/[id]`         | Admin    | Delete product                     |
| PUT    | `/api/admin/inventory/[id]`        | Admin    | Adjust inventory                   |
| GET    | `/api/admin/orders`                | Admin    | List all orders                    |
| PUT    | `/api/admin/orders/[id]`           | Admin    | Transition order / payment status  |
| GET    | `/api/admin/coupons`               | Admin    | List coupons                       |
| POST   | `/api/admin/coupons`               | Admin    | Create coupon                      |
| PUT    | `/api/admin/coupons/[id]`          | Admin    | Update coupon                      |
| GET    | `/api/admin/users`                 | Admin    | List users                         |
| PATCH  | `/api/admin/users/[id]`            | Admin    | Change role (single-admin policy)  |
| PUT    | `/api/admin/reviews/[id]`          | Admin    | Approve/hide review                |

Admin order transitions follow `lib/orders/status.ts`; invalid transitions return 409.
Cancellation/return restores stock, reverses `soldCount`, releases coupon usage, and is
safe to retry (same-status updates are idempotent no-ops).

---

## Admin access

1. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
2. Run `npx prisma db seed` — creates the admin user (verified).
3. Sign in at `/login` with those credentials, then open `/admin`.

To promote an existing user manually:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'someone@example.com';
```

---

## Testing

```bash
npm test            # single run
npm run test:watch  # watch mode
```

Unit tests live in `tests/unit/` and cover the framework-free domain logic in `lib/`:

| Test file                  | Covers                                      |
| -------------------------- | ------------------------------------------- |
| `password.test.ts`         | `lib/auth/password` — hashing & verification |
| `jwt.test.ts`              | `lib/auth/jwt` — token round-trip & rejection |
| `coupon.test.ts`           | `lib/coupons/engine` — discount math & eligibility |
| `pricing.test.ts`          | `lib/orders/pricing` — subtotal, discount, delivery |
| `checkout-inventory.test.ts` | `lib/orders/checkout` — stock shortfall reporting |
| `authz.test.ts`            | `lib/auth/session` — `assertRole` guards    |
| `format.test.ts`           | `lib/utils/format` — `formatPKR`, `slugify` |
| `tokens.test.ts`           | `lib/auth/tokens` — password-reset token hashing |
| `json-ld.test.ts`          | `lib/utils/json-ld` — JSON-LD script escaping |

The full suite currently runs **54 unit tests**. It is self-contained and does
not need a database.

### API integration tests

```bash
npm run test:api   # provisions a TEST database, then runs tests/api/
```

API tests call the real route handlers (no HTTP server needed) against a
**separate Postgres database** (`anilliea_test` by default — never your dev
database). The run first pushes the schema and seeds known data, then exercises
the full flows:

| Test file            | Covers                                                        |
| -------------------- | ------------------------------------------------------------- |
| `auth.test.ts`       | register / login / me / logout, validation, rate limiting     |
| `products.test.ts`   | product listing, pagination, search, detail, categories       |
| `cart.test.ts`       | cart CRUD, stock limits, coupon apply/remove/validate        |
| `checkout.test.ts`   | order placement, totals math, stock decrement, cart clearing  |
| `admin.test.ts`      | RBAC (401/403), staff promote/demote guards, dashboard        |
| `misc.test.ts`       | wishlist, newsletter, contact                                 |
| `workflows.test.ts`  | end-to-end A–E: checkout, admin→storefront, RBAC, concurrent last-unit stock, failed payment/coupon, coupon limits, cancel/restock |

The API suite currently runs **50 tests across 7 files**. Requirements: a
running Postgres 16 (e.g. `docker compose up -d`). Override the test database
with `TEST_DATABASE_URL` (default `anilliea_test`). The provisioning script
resets only that isolated test database.

### Browser smoke test

```bash
npm run dev             # in one terminal
npm run test:e2e        # in another
```

Uses the locally installed Google Chrome through `playwright-core`. It visits
the storefront, checks horizontal overflow at 375/390/430/768/1024/1280/1440,
logs the seeded customer in, verifies the session survives a reload, adds an
item to the cart, and verifies the admin dashboard loads. Screenshots are
written to `tests/e2e/artifacts/` (gitignored). Requires `DEMO_PASSWORD` (and
optionally `ADMIN_EMAIL`/`ADMIN_PASSWORD`) in `.env`; override Chrome with
`CHROME_PATH` and the URL with `E2E_BASE_URL`.

---

## Deployment

Recommended: **Vercel** (app) + **managed Postgres** (e.g. Neon, Supabase, RDS).

1. Provision a Postgres 16 database and copy its connection string.
2. In the Vercel project, set **all required env vars** (see table above): `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` (your production URL), SMTP + bank details as needed.
3. Build command: `prisma generate && next build` (already the `build` script).
4. Apply migrations from CI or a one-off job — **never `migrate dev` in production**:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed only if you want demo data in that environment:
   ```bash
   npx prisma db seed   # requires ADMIN_PASSWORD and DEMO_PASSWORD
   ```
6. Point your domain at the Vercel project and update `NEXT_PUBLIC_APP_URL`.
7. If admin uploads should persist, create a Vercel Blob store and set
   `BLOB_READ_WRITE_TOKEN`. Without it, local uploads disappear on redeploy.

### Backups and recovery

- Enable automated daily backups + point-in-time recovery on the managed
  Postgres; verify a restore into a *separate* database at least quarterly.
- Before every production migration, take an on-demand snapshot. Use
  `prisma migrate deploy` only; never `migrate dev`, `db push`, or a reset
  against production.
- Back up the Blob store/object storage separately — database backups do not
  include uploaded media.
- Keep `JWT_SECRET` in the host's secret manager. Rotating it signs everyone
  out (acceptable for incident response; coordinate with the business).
- `GET /api/diag` reports booleans/counts only. In production it requires
  `Authorization: Bearer $DIAG_TOKEN`; leave `DIAG_TOKEN` unset to disable it
  entirely.

---

## Production security checklist

- [ ] `JWT_SECRET` is a long random string, unique per environment, stored in the host's secret manager (not in code)
- [ ] `ADMIN_PASSWORD` / `DEMO_PASSWORD` are strong; demo seed users removed or re-secured if the DB was ever seeded in prod
- [ ] `DATABASE_URL` uses a least-privilege DB user; credentials not logged
- [ ] HTTPS enforced; `Secure`, `HttpOnly`, `SameSite` cookie flags on the session cookie
- [ ] Rate limiting on `/api/auth/*` (login, register, forgot-password)
- [ ] CORS locked down if the API is ever consumed cross-origin
- [ ] Prisma migrations applied via `migrate deploy`; no `db push` against production
- [ ] Error responses don't leak stack traces or SQL details
- [ ] Backups configured for the managed Postgres instance

---

## Notes & limitations

- **Payments:** the platform supports **Cash on Delivery** and **bank transfer** today. There is a payment abstraction (`PAYMENT_SECRET`, `PaymentMethod`/`PaymentStatus` enums) ready for a future online gateway (e.g. Stripe/JazzCash/Easypaisa), but no gateway is integrated yet — do not advertise online card payments.
- **Email:** order-confirmation email is best-effort; checkout never fails because email delivery failed. Password reset *requires* SMTP in production (returns 503 otherwise). Email verification is not implemented.
- **Rate limiting:** the fixed-window limiter is in-process memory. It works on a single long-lived Node instance but is not shared across serverless instances; add a shared store (e.g. Redis/Upstash) before relying on it for abuse prevention at scale.
- **Sessions:** stateless 7-day JWTs. Changing a password does not revoke other existing sessions yet.
- **Payments:** ONLINE is intentionally rejected until a gateway is integrated. COD/bank-transfer orders remain `PENDING` until an admin marks them paid.
- **Dashboard "order value":** sums non-cancelled order totals, including COD/bank-transfer orders not yet paid. It is not collected revenue.
- Prices are whole PKR integers everywhere (`price`, `compareAtPrice`, coupon `value`) — no floating-point money math.
- Known lint warnings (5, no errors): a few admin `<img>` tags and a custom font `<link>` in the root layout. They are non-blocking and tracked in the audit report.
