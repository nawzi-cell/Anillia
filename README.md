# ANILLIÉA

**ANILLIÉA** is a premium modest-fashion e-commerce platform — hijabs, underscarves, niqabs, accessories and curated gift bundles, sold in PKR to customers across Pakistan. Built with Next.js 14, Prisma 5 + PostgreSQL, and TypeScript (strict).

> **Status:** under active development by a small team. The storefront, API routes and backend library modules are being built in parallel — this README is the shared contract. Anything marked as planned is not yet implemented.

---

## Features

- **Storefront** — product catalogue with categories, collections, search, sort and filters; product detail pages with color/size variants and image galleries
- **Cart & checkout** — guest-friendly cart, coupon codes, delivery method choice (Standard / Express), COD and bank-transfer payment
- **Accounts** — email/password auth with JWT sessions, email verification, password reset, saved addresses
- **Orders** — order history, status tracking, inventory reservation on checkout, low-stock signals
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
| `PAYMENT_SECRET`      | no       | —                                               | Verifies payment callbacks once an online gateway is integrated |

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
| POST   | `/api/auth/register`               | Public   | Create account, send verify email  |
| POST   | `/api/auth/login`                  | Public   | Email/password → JWT session       |
| POST   | `/api/auth/logout`                 | Customer | Invalidate session                 |
| GET    | `/api/auth/me`                     | Customer | Current user profile               |
| POST   | `/api/auth/verify-email`           | Public   | Verify email with token            |
| POST   | `/api/auth/forgot-password`        | Public   | Send password-reset email          |
| POST   | `/api/auth/reset-password`         | Public   | Reset password with token          |

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
| GET    | `/api/cart`                        | Public*  | Current cart (*session cookie)      |
| POST   | `/api/cart/items`                  | Public*  | Add item                           |
| PATCH  | `/api/cart/items/[id]`             | Public*  | Update quantity/variant            |
| DELETE | `/api/cart/items/[id]`             | Public*  | Remove item                        |
| POST   | `/api/coupons/validate`            | Customer | Validate code against cart         |
| POST   | `/api/checkout`                    | Customer | Create order (reserves inventory)  |

### Orders & account

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/orders`                      | Customer | Own order history                  |
| GET    | `/api/orders/[id]`                 | Customer | Own order detail                   |
| GET    | `/api/addresses`                   | Customer | Saved addresses                    |
| POST   | `/api/addresses`                   | Customer | Add address                        |
| PATCH  | `/api/addresses/[id]`              | Customer | Update address                     |
| DELETE | `/api/addresses/[id]`              | Customer | Delete address                      |
| POST   | `/api/reviews`                     | Customer | Submit review (→ PENDING moderation)|

### Admin

| Method | Route                              | Auth     | Description                        |
| ------ | ---------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/admin/products`              | Admin    | List all products                  |
| POST   | `/api/admin/products`              | Admin    | Create product                     |
| PATCH  | `/api/admin/products/[id]`         | Admin    | Update product                     |
| DELETE | `/api/admin/products/[id]`         | Admin    | Delete product                     |
| PATCH  | `/api/admin/inventory/[id]`        | Admin    | Adjust inventory                   |
| GET    | `/api/admin/orders`                | Admin    | List all orders                    |
| PATCH  | `/api/admin/orders/[id]`           | Admin    | Update order/payment status        |
| GET    | `/api/admin/coupons`               | Admin    | List coupons                       |
| POST   | `/api/admin/coupons`               | Admin    | Create coupon                      |
| PATCH  | `/api/admin/coupons/[id]`          | Admin    | Update coupon                      |
| GET    | `/api/admin/users`                 | Admin    | List users                         |
| PATCH  | `/api/admin/reviews/[id]`          | Admin    | Approve/hide review                |

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

Note: the `lib/` modules above are built by the backend engineer against the contracts documented at the top of each test file — tests fail to import until those modules land.

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

Requirements: a running Postgres 16 (e.g. `docker compose up -d`).
Override the test database with `TEST_DATABASE_URL`.

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
- **Email:** transactional email (verification, password reset, order confirmation) is **best-effort / log-based until SMTP is configured**. Set the `SMTP_*` variables to send real email.
- Prices are whole PKR integers everywhere (`price`, `compareAtPrice`, coupon `value`) — no floating-point money math.
