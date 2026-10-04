# ANILLIÉA — Admin Guide

A plain-language manual for running the store. Everything below happens in the
**admin panel** at `/admin` (sign in first with your admin account).

> **Getting in:** open `/login`, sign in with the admin email and password,
> then go to `/admin`. Only accounts with the **ADMIN** role can open the
> admin panel — customers are blocked automatically.

---

## 1. Dashboard (`/admin`)

The first screen after signing in. It shows at a glance:

- **Total revenue, orders, customers, products** — headline numbers.
- **Sales chart** — revenue over recent days.
- **Low-stock products** — items at or below their low-stock threshold. Restock these first.
- **Recent orders, customers, reviews** — quick links into each section.

Nothing here is editable — it is your morning briefing. Click any row to jump
to the relevant management page.

---

## 2. Products (`/admin/products`)

### Add a new product

1. Click **New product** (top right).
2. Fill in the fields:
   - **Name** — e.g. "Crinkle Georgette Hijab". The **Slug** auto-generates
     from the name (used in the product URL: `/product/crinkle-georgette-hijab`).
     You can edit the slug, but keep it lowercase with dashes.
   - **Description** — the full story shown on the product page.
   - **Short description** — one or two lines shown in listings.
   - **Price (PKR)** — whole rupees, no decimals. This is the selling price.
   - **Compare-at price (PKR)** — optional. Set it higher than the price to
     show a "was / now" discount badge. Leave empty for no discount.
   - **SKU** — your stock-keeping code, e.g. `ANL-HJB-001`. Must be unique.
   - **Category** — pick from the dropdown (managed under Categories).
   - **Colors** — comma-separated, e.g. `Ivory, Espresso, Olive`.
   - **Material** — e.g. `100% crinkle georgette`.
   - **Care instructions** — e.g. `Hand wash cold, dry flat`.
   - **Featured** — tick to show it in "Best Sellers" style sections.
   - **Published** — tick to make it visible in the shop. Untick to hide it
     while you keep working (draft mode).
3. **Images** — click *Add image*, paste the **Image URL**, and write **Alt text**
   (describe the photo for accessibility/SEO, e.g. "Ivory crinkle hijab draped").
   The first image is the main one. Use *Remove* to delete any row.
   > Images must already be hosted somewhere (see §12). Paste the full URL
   > starting with `https://`.
4. **Variants** — if the product comes in sizes or colors with their own stock
   or price, click *Add variant* and fill in Name, Color, Size, SKU
   (unique per variant), optional price override, and stock quantity.
   Products without variants just use the main product's stock.
5. Click **Save**. The product appears in the shop immediately if Published.

### Edit a product

Click any product in the list (or the edit icon). Change any field, image, or
variant, then **Save**. Price changes apply to new orders only — existing
orders keep the price the customer paid.

### Remove a product

Open the product, click **Delete**, and confirm. This is permanent.
> Tip: to temporarily hide a product without deleting it, just untick
> **Published** and save. Safer than deleting.

### Publish / unpublish

The **Published** toggle on the product form (or the status control in the
list) controls visibility in the shop instantly. Unpublished products return a
404 on the storefront but stay in the admin.

---

## 3. Categories & Collections

### Categories (`/admin/categories`)

Categories are the shop's departments: Hijabs, Underscarves, Niqabs,
Accessories, Gift Sets, Deals, Modest Essentials.

- **Add:** click *New category*, enter Name, Slug (auto), and Description.
- **Edit:** click a category to rename it or change its description/slug.
- **Delete:** click Delete and confirm. Products in a deleted category become
  uncategorized — reassign them first if that matters to you.

The shop page `/shop/[category]` is generated from these automatically.

### Collections (`/admin/collections`)

Collections are curated edits (e.g. "The Everyday Edit", "Signature Bundles",
"The Gift Edit") shown on the homepage and at `/collections`.

- Manage them exactly like categories: New / Edit / Delete.
- **Adding products to a collection:** open the product in
  `/admin/products`, and assign its collection in the product form.

---

## 4. Inventory (`/admin/inventory`)

One row per product/variant SKU showing:

- **SKU, product, variant**
- **Available** — units ready to sell.
- **Reserved** — units held by unpaid/in-progress orders.
- **Low-stock flag** — highlighted when available is at or below the
  product's low-stock threshold.

### Adjust stock

Click a row (or the adjust control), enter the new quantity or an
adjustment (+/-), and save. Use this when new stock arrives or for manual
corrections. Every adjustment is written to the **audit log**.

> The storefront never oversells: if available stock hits zero, the product
> shows "Out of stock" and checkout is blocked for it automatically.

---

## 5. Orders (`/admin/orders`)

Click an order to open its detail page: customer info, shipping address,
items with prices, coupon used, delivery method, payment method and status.

### Update order status

On the order detail page, change the **Status** dropdown:

| Status | Meaning |
|---|---|
| `PENDING` | Just placed, awaiting confirmation |
| `CONFIRMED` | You accepted the order |
| `PROCESSING` | Being packed/prepared |
| `SHIPPED` | Handed to the courier |
| `DELIVERED` | Customer received it |
| `CANCELLED` | Cancelled — stock is released back |
| `RETURN_REQUESTED` | Customer asked for a return |
| `RETURNED` | Return completed |

The customer sees the status on their order tracking page
(`/account/orders`). Move orders forward step by step; every change is logged.

### Payment status

Set separately on the same page: `PENDING`, `PAID`, `FAILED`, `REFUNDED`.
For **Cash on Delivery**, mark `PAID` once the courier confirms collection.
For **bank transfer**, mark `PAID` after you verify the receipt.

---

## 6. Customers (`/admin/customers`)

A list of everyone who registered. Click a customer to see their profile,
addresses, order history, and total spent. You cannot edit a customer's
details here (they manage their own profile) and you cannot see passwords
(passwords are never visible to anyone — that is by design).

---

## 7. Staff & Access (`/admin/staff`)

Manage who can open the admin panel — no database work needed.

- The list shows **every registered user** with their role badge
  (**Admin** or **Customer**), order count, and join date. Use the
  **Everyone / Admins / Customers** filter tabs and the search box to find
  someone. (The person must register an account first — you cannot create
  accounts from here, only change roles.)
- **Make admin:** click *Make admin* on a customer's row, read the
  confirmation, and confirm. They get full admin access immediately.
- **Demote:** click *Demote* on an admin's row to turn them back into a
  regular customer. They lose admin access immediately.

Safety rules (enforced automatically):

- You **cannot change your own role** — the button is disabled on your row.
- You **cannot demote the last remaining admin** — promote a replacement first.
- Every promotion and demotion is written to the **audit log** with who did
  it and when.

## 8. Coupons (`/admin/coupons`)

### Create a coupon

1. Click **New coupon**.
2. Fill in:
   - **Code** — what customers type, e.g. `WELCOME10`. Uppercase, no spaces.
   - **Discount type** — `PERCENTAGE` (e.g. 10 = 10% off) or `FIXED_AMOUNT`
     (e.g. 500 = PKR 500 off).
   - **Percentage off / Discount amount** — the value.
   - **Max discount (PKR)** — cap for percentage coupons (so 20% off never
     exceeds, say, PKR 2,000). Leave empty for no cap.
   - **Min order amount (PKR)** — coupon only applies above this subtotal.
   - **Usage limit** — total number of times the code can ever be used.
     Leave empty for unlimited.
   - **Start / Expiry date** — the window the code is valid in.
   - **Active** — tick to enable immediately.
3. Click **Save**.

### Manage coupons

- **Edit** any coupon to change its value, dates, or limits.
- **Deactivate** by unticking Active (or deleting it) — it stops working
  instantly at checkout.
- **Usage count** shows how many times each code has been redeemed.

> Coupons are validated on the server at checkout — customers cannot tamper
> with discounts from the browser.

---

## 9. Reviews (`/admin/reviews`)

Customer reviews arrive with status **Pending**.

- **Approve** — publishes the review on the product page.
- **Hide** — keeps it in the system but removes it from the product page.
- **Delete** — removes it permanently.

Only verified buyers (customers with a delivered order containing the
product) get the "Verified purchase" badge. There is no way to invent
reviews from the admin — and that is intentional.

---

## 10. Messages (`/admin/messages`)

Contact-form submissions from `/contact` land here. Open a message to read
it, reply to the customer by email, mark it handled, or delete it.

---

## 11. Newsletter (`/admin/newsletter`)

Everyone who subscribed via the website footer or homepage form is listed
here with their signup date.

- **Export CSV** — download the list for your email tool
  (Mailchimp, Klaviyo, etc.).
- **Remove** subscribers on request.

> The site itself only collects signups — campaigns are sent from your
> email marketing tool, not from the admin panel.

---

## 12. Audit logs (`/admin/audit-logs`)

A tamper-evident record of everything admins do: product created/updated/
deleted, order status changes, inventory adjustments, coupon changes, review
moderation. Each entry stores **who, what, when, and from which IP address**.
Use it to answer "who changed this price?" — filter by admin, action, or date.

---

## 13. Changing images

There are two kinds of images:

**Product images** — managed per product in `/admin/products` (see §2).
Paste the image URL into the form. Recommended: 1200×1500px (4:5), JPG or
WebP, under 300KB each, consistent lighting/background across the catalogue.

**Site imagery** (homepage banners, brand story, journal covers, collection
tiles) — these live in the project's `public/images/` folder:

| Image | File |
|---|---|
| Homepage hero | `public/images/hero-editorial.svg` |
| Brand story | `public/images/brand-story.svg` |
| Collection tiles | `public/images/collection-*.svg` |
| Journal covers | `public/images/journal-*.svg` |
| Styling inspiration | `public/images/styling-*.svg` |
| Social share image | `public/images/og-cover.svg` |
| Logo | `public/logo/anilliea-logo.png` (badge) and `public/logo/anilliea-mark.png` (gold mark) |

To swap one: replace the file with your new image **keeping the exact same
filename**, then redeploy. (Ask your developer if you are unsure — filenames
and paths must match exactly.)

---

## 14. Changing journal articles

Articles are **not** managed in the admin panel — they live in the file
`content/journal.ts`. To add, edit, or remove an article, ask your developer,
or edit the file yourself following this pattern:

```ts
{
  slug: "my-new-article",            // lowercase, dashes, unique — becomes the URL /journal/my-new-article
  title: "My New Article",
  excerpt: "One or two sentences shown on the journal listing page.",
  date: "2026-10-15",               // YYYY-MM-DD
  image: "/images/journal-1.svg",   // cover image path
  content: [
    "First paragraph…",
    "Second paragraph…",
  ],
},
```

- **Add:** copy an existing block, paste it into the `journalPosts` list, and
  change every field (especially the slug).
- **Edit:** change the title, text, or image of an existing block.
- **Remove:** delete the whole `{ … },` block.
- Then redeploy the site for the change to go live.

---

## 15. Settings (`/admin/settings`)

Store-level controls:

- **Store info** — brand name and tagline shown in a few system places.
- **Change password** — update your own admin password.
- **Danger zone** — destructive actions, each with a confirmation step.
  Read carefully before confirming.

---

## 16. Quick-reference: everyday tasks

| I want to… | Go to… |
|---|---|
| Add a product | `/admin/products` → New product |
| Hide a product temporarily | Product form → untick Published |
| Delete a product | Product form → Delete (permanent!) |
| Change a price | `/admin/products` → edit product → Price |
| Add a product photo | Product form → Images → Add image (paste URL) |
| Restock an item | `/admin/inventory` → adjust quantity |
| Add a category | `/admin/categories` → New category |
| Add a collection | `/admin/collections` → New collection |
| Move an order to Shipped | `/admin/orders` → open order → Status |
| Mark a COD order as paid | Order detail → Payment status → PAID |
| Create a discount code | `/admin/coupons` → New coupon |
| Turn off a discount code | `/admin/coupons` → untick Active |
| Publish a review | `/admin/reviews` → Approve |
| Read contact messages | `/admin/messages` |
| Download subscriber list | `/admin/newsletter` → Export CSV |
| Make someone an admin | `/admin/staff` → find user → Make admin |
| Remove admin access | `/admin/staff` → find user → Demote |
| See who changed what | `/admin/audit-logs` |
| Publish a journal article | Edit `content/journal.ts` → redeploy |

---

## 17. Safety notes

- **Deleting is permanent** for products, categories, coupons, and reviews.
  When in doubt, unpublish/deactivate instead.
- **Never share your admin password.** Each staff member should have their
  own admin account so the audit log stays meaningful.
- **Prices and discounts are always calculated by the server.** What you set
  in the admin is exactly what customers are charged — double-check figures
  before saving.
- If something looks wrong on the website after a change, check the audit
  log first — it shows exactly what was changed and when.
