# ANILLIÉA — Staff Guide (Simple Version)

This guide is for shop staff who manage the website day to day.
No technical knowledge needed — just follow the steps.

> **How to open the admin panel**
> 1. Go to the website and click **Login** (or open `/login`).
> 2. Sign in with your staff email and password.
> 3. Go to `/admin`.
>
> [Screenshot: login page with email and password fields]

---

## The main screen (Dashboard)

After you sign in, you see the Dashboard. It shows:

- How much money the shop made
- How many orders came in
- **Low-stock products** — items running out. Tell your manager or restock these first.
- Newest orders, customers, and reviews

You don't change anything here — it is just an overview.

[Screenshot: dashboard with numbers and charts]

---

## Adding a new product

1. Click **Products** in the left menu.
2. Click the **New product** button (top right).

[Screenshot: products list with "New product" button highlighted]

3. Fill in the boxes:
   - **Name** — the product name, e.g. "Crinkle Georgette Hijab".
   - **Description** — write about the product (fabric, how it feels, who it is for).
   - **Short description** — one short line.
   - **Price (PKR)** — the selling price, numbers only, e.g. `1499`.
   - **Compare-at price** — only if there is a discount. Write the old price here, e.g. `1999`. Leave empty if no discount.
   - **SKU** — the product code, e.g. `ANL-HJB-001`. Every product needs a different code.
   - **Category** — choose from the list (Hijabs, Underscarves, etc.).
   - **Colors** — write the colors separated by commas, e.g. `Ivory, Beige, Black`.
   - **Material** — e.g. `Soft georgette`.
   - **Care instructions** — e.g. `Hand wash cold`.
4. **Published** — keep this ON if you want customers to see the product now. Turn it OFF if it is not ready yet.
5. Click **Save**.

[Screenshot: new product form]

---

## Adding photos to a product

1. Open the product (click it in the Products list).
2. Scroll to **Images**.
3. Click **Add image**.
4. Paste the photo link (URL) into **Image URL**.
5. Write **Alt text** — a short description of the photo, e.g. "Beige hijab folded".
6. The **first photo** is the main one customers see. To change the order, remove and re-add.
7. Click **Save**.

> Photos must already be uploaded to the internet (your manager will give you the links).

[Screenshot: product images section]

---

## Changing a product

1. Go to **Products**, click the product you want to change.
2. Change whatever you need — name, price, description, photos.
3. Click **Save**. The website updates immediately.

---

## Removing a product

1. Open the product.
2. Click **Delete** and confirm.

⚠️ **Deleting is permanent — the product is gone forever.**
If you only want to hide it for a while, turn **Published** OFF instead and click Save. Much safer.

---

## Adding sizes or colors with separate stock (Variants)

Some products have sizes (S, M, L) or colors that need their own stock count.

1. Open the product.
2. Scroll to **Variants**, click **Add variant**.
3. Fill in: name (e.g. "Black / Medium"), SKU (a unique code), and **Stock quantity**.
4. Click **Save**.

---

## When new stock arrives (Inventory)

1. Go to **Inventory** in the left menu.
2. Find the product in the list.
3. Click it and update the **quantity**.
4. Save.

Items with very low stock are highlighted — these need restocking urgently.

[Screenshot: inventory list with a low-stock row highlighted]

---

## Handling orders

1. Go to **Orders**. Newest orders are on top.
2. Click an order to see everything: customer name, address, what they bought, how they paid.

### Moving an order forward

Change the **Status** box as the order moves along:

1. **PENDING** — new order, you haven't confirmed it yet
2. **CONFIRMED** — you accept the order ✅
3. **PROCESSING** — you are packing it 📦
4. **SHIPPED** — you gave it to the courier 🚚
5. **DELIVERED** — the customer received it 🎉

Special cases:
- **CANCELLED** — the order is cancelled (stock goes back automatically)
- **RETURN_REQUESTED** / **RETURNED** — the customer wants to return something

The customer can see this status on their own order page, so keep it up to date.

[Screenshot: order detail page with status dropdown]

### Marking payment

On the same order page, set the **Payment status**:

- **Cash on Delivery (COD):** mark **PAID** when the courier confirms they collected the money.
- **Bank transfer:** mark **PAID** after you check the bank and see the money arrived.

---

## Creating a discount code (Coupons)

1. Go to **Coupons**.
2. Click **New coupon**.
3. Fill in:
   - **Code** — the word customers type, e.g. `EID20` (capital letters, no spaces).
   - **Discount type** — choose **PERCENTAGE** (e.g. 20 = 20% off) or **FIXED_AMOUNT** (e.g. 500 = Rs. 500 off).
   - **Percentage off / Discount amount** — the number.
   - **Min order amount** — optional. E.g. `2000` means the code only works on orders above Rs. 2,000.
   - **Start date / Expiry date** — when the code starts and stops working.
   - **Active** — keep ON so the code works.
4. Click **Save**.

To stop a code: open it and turn **Active** OFF. It stops working immediately.

[Screenshot: new coupon form]

---

## Approving customer reviews

1. Go to **Reviews**.
2. New reviews say **Pending**.
3. Read the review:
   - Looks good? Click **Approve** — it appears on the product page.
   - Rude or spam? Click **Delete**.
   - Not sure? Click **Hide** — it stays saved but customers can't see it.

---

## Reading customer messages

1. Go to **Messages**. These come from the Contact page on the website.
2. Click a message to read it.
3. Reply to the customer by email, then delete the message or leave it.

---

## Newsletter subscribers

Go to **Newsletter** to see everyone who signed up for emails.

- Click **Export CSV** to download the list (you can open it in Excel).

---

## Product categories and collections

- **Categories** (`/admin/categories`): the departments — Hijabs, Underscarves, Niqabs, etc. You can add new ones or rename them.
- **Collections** (`/admin/collections`): special groups like "The Gift Edit". Same — add, rename, delete.

⚠️ If you delete a category, products in it lose their category. Move the products first.

---

## Managing staff access (Admins)

> Only do this if your manager asked you to.

1. Go to **Staff & Access** in the left menu (under System).
2. Find the person using the search box (they must already have an account — ask them to register on the website first if they don't).
3. Click **Make admin** next to their name, read the confirmation, and confirm.
4. To remove someone's access: click **Demote** on their row.

Rules:
- You **cannot change your own access** — that button is turned off for you.
- There must always be at least one admin — the system will stop you from removing the last one.
- Every change is recorded automatically.

[Screenshot: staff list with "Make admin" button highlighted]

---

## What NOT to touch

- **Audit logs** — this is a record of who changed what. Just for looking.
- **Settings → Danger zone** — can break the shop. Ask your manager first.
- If the website looks broken after a change, tell your manager what you clicked — the audit log will show exactly what happened.

---

## Quick help table

| I want to… | Where to click |
|---|---|
| Add a product | Products → New product |
| Hide a product for now | Open product → turn OFF Published → Save |
| Change a price | Products → open product → Price → Save |
| Add a photo | Open product → Images → Add image → Save |
| Add new stock | Inventory → find item → update quantity |
| Confirm an order | Orders → open order → Status → CONFIRMED |
| Mark order shipped | Orders → open order → Status → SHIPPED |
| Mark COD as paid | Order page → Payment status → PAID |
| Make a discount code | Coupons → New coupon |
| Stop a discount code | Coupons → open it → turn OFF Active |
| Approve a review | Reviews → Approve |
| Download email list | Newsletter → Export CSV |
| Read customer messages | Messages |
| Give someone admin access | Staff & Access → Make admin (ask your manager first) |

---

*Need something not covered here? Ask your manager — they have the full technical guide.*
