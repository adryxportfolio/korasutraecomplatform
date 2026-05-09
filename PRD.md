# Korasutra — Self-Hosted Commerce Platform
## Product Requirements Document

**Version:** 1.0
**Owner:** Korasutra
**Status:** Draft — pending implementation
**Last updated:** 2026-05-02

---

## 1. Executive Summary

Replace the current Shopify-backed storefront with a fully self-hosted, single-page commerce flow on Vercel + Supabase. The platform owns the entire customer journey: catalog → WhatsApp OTP login → checkout → payment (Razorpay or COD +₹200) → order management → tracking emails. Admins manage everything from a redesigned `/admin` panel: products, inventory, SKUs, customers, orders, and sales.

**Hard constraint:** the live storefront (`korasutra.com`) must not break during the transition. Existing products are migrated end-to-end without manual re-entry.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Eliminate Shopify dependency for catalog, checkout, payments, customers, and orders.
- One-page, one-flow checkout: cart → address → payment → done.
- Native WhatsApp OTP login via **AISensy** (replacing MSG91).
- Native payments via **Razorpay** (UPI, cards, netbanking, wallets) + **COD** with a ₹200 surcharge applied at checkout.
- Real-time admin dashboard: orders, inventory, customers, sales — all live via Supabase Realtime.
- Transactional email via Resend: customer order confirmation with tracking link, plus admin notification to `korasutra.official@gmail.com`.
- Migrate every existing Shopify product (titles, images, variants, SKUs, prices, descriptions, blouse flag, category) into the new database **automatically**.
- Preserve URL structure (`/products/:handle`) so SEO is not lost.

### 2.2 Non-Goals (v1)
- Multi-warehouse / multi-location inventory.
- B2B / wholesale pricing tiers.
- Subscriptions or recurring billing.
- Multi-currency (INR only).
- Native mobile app.
- Self-serve customer accounts page beyond order tracking and saved addresses.
- International shipping (India only at launch).

---

## 3. Personas

| Persona | Goals | Key flows |
|---|---|---|
| **Shopper** | Browse sarees, log in fast, check out without friction, track order. | Catalog → PDP → Cart → OTP login → Checkout → Confirmation → Tracking link in email. |
| **Repeat Customer** | Reuse saved address, fast re-order, see order history. | Login (OTP) → My Orders → Re-order. |
| **Admin (Owner)** | Add products, manage inventory, see live orders, update fulfilment, view sales. | `/admin` login → Dashboard → Products / Orders / Customers / Inventory. |

---

## 4. Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     React SPA (Vercel)                         │
│  Storefront · /admin · /checkout · /order-tracking/:id         │
└─────────────────┬──────────────────────────┬───────────────────┘
                  │                          │
                  ▼                          ▼
       ┌─────────────────────┐   ┌──────────────────────────┐
       │   Supabase (Cloud)  │   │   Edge Functions (Deno)  │
       │  Postgres + RLS     │   │  • aisensy-send-otp      │
       │  Realtime           │   │  • aisensy-verify-otp    │
       │  Storage (images)   │   │  • razorpay-create-order │
       │                     │   │  • razorpay-verify       │
       │                     │   │  • place-order           │
       │                     │   │  • admin-login/session   │
       │                     │   │  • send-order-emails     │
       │                     │   │  • update-order-status   │
       └─────────────────────┘   └──────────────────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌──────────────┐    ┌──────────────┐     ┌──────────────┐
                   │   AISensy    │    │   Razorpay   │     │    Resend    │
                   │  (WhatsApp)  │    │   Payments   │     │    Email     │
                   └──────────────┘    └──────────────┘     └──────────────┘
```

**Key principle:** the browser never holds privileged credentials. AISensy, Razorpay, and Resend all live behind server-side functions. Tokens (customer + admin) are server-issued and validated via SECURITY DEFINER functions used in RLS.

---

## 5. Data Model

Defined in `db/migration.sql`. Summary:

| Table | Purpose |
|---|---|
| `admin_users`, `admin_sessions`, `user_roles` | Admin auth (separate from customers; no privilege escalation). |
| `customers`, `customer_sessions`, `customer_addresses`, `otp_verifications` | WhatsApp-OTP based identity, no Supabase `auth.users` dependency. |
| `categories`, `products`, `product_images`, `product_variants` | Catalog. SEO fields, `has_blouse_piece`, `compare_at_price`, max-5 images, SKU per variant. |
| `inventory_movements` | Append-only ledger for every stock change (purchase, restock, adjustment, return, cancellation). |
| `orders`, `order_items` | Snapshotted contact + address + line items. Razorpay IDs, COD surcharge, fulfilment timestamps. Order numbers via sequence (`KS-100001+`). |
| `reviews` | Existing review system, preserved. |

**Realtime publication:** `orders`, `order_items`, `product_variants`.
**RLS:** public read on active products; customer-owns-own-data; admin-sees-all-orders via `is_admin()` helper; admin tables locked except via service-role edge functions.

---

## 6. Functional Requirements

### 6.1 Storefront (public)
- **Catalog** at `/`, `/collections/:slug` — reads from `products` table, filters by category / fabric / price (existing UX preserved).
- **PDP** at `/products/:handle` — title (Title Case, no brand suffix), image gallery (max 5, pinch-to-zoom on mobile), price (Poppins font, GST-inclusive), variants, blouse-piece disclaimer when applicable, fabric badges, reviews, recommendations by technique → fabric → fallback.
- **Cart drawer** — local Zustand (already implemented), max quantity bounded by `inventory_qty`.
- **Wishlist, Recently Viewed, Journals** — unchanged.
- **Empty state:** `"No products found"` if catalog is empty.

### 6.2 Authentication (WhatsApp OTP via AISensy)
- Trigger points: cart "Proceed to Checkout", PDP "Buy Now", `/admin` (separate flow).
- **Flow:**
  1. User enters mobile number (default `+91`).
  2. `POST /functions/v1/aisensy-send-otp` → server generates 6-digit OTP, stores **bcrypt hash** in `otp_verifications`, sends template message via AISensy.
  3. User enters OTP → `POST /functions/v1/aisensy-verify-otp` → server compares, on success creates/updates `customers` row, issues opaque `customer_session` token, returns it to client.
  4. Client stores token in `localStorage` and sends as `x-session-token` header on every Supabase request.
- **Rate limits:** max 3 OTPs per phone per hour, max 5 verify attempts per OTP, 10-minute expiry.
- **Cleanup:** `cleanup_expired_sessions()` runs daily via pg_cron.

### 6.3 Checkout (`/checkout`)
**Single page, three accordion steps:**
1. **Contact** — phone (pre-filled from session), email (optional, used for order receipt).
2. **Shipping address** — pick from saved addresses or add new (full name, phone, line1/2, city, state, PIN, country=India). Save toggle.
3. **Payment**
   - **Razorpay** (default) — opens Razorpay Checkout modal in same tab.
   - **COD** — adds **+₹200** surcharge line, no third-party redirect.

**Order summary panel** (sticky on desktop): line items with thumbnails, subtotal, shipping (free), COD surcharge if applicable, total — all in Poppins.

**Place Order button:**
- For Razorpay: `razorpay-create-order` → opens checkout → on `payment.success` → `razorpay-verify` (HMAC-SHA256 signature check) → `place-order` writes the order atomically.
- For COD: `place-order` directly.

**`place-order` edge function (atomic):**
1. Re-validate cart against current inventory (block if any item is out of stock).
2. Generate order number from `order_number_seq`.
3. Insert `orders` row + `order_items` rows.
4. Insert one `inventory_movements` row per item (`reason='purchase'`, negative delta).
5. Decrement `product_variants.inventory_qty`.
6. Trigger `send-order-emails` (fire-and-forget).
7. Return `{ order_id, order_number }` to client.

Client redirects to `/order-tracking/:order_number` on success.

### 6.4 Order Tracking
- Route `/order-tracking/:orderNumber` (replacing the external redirect).
- Shows status timeline: `pending_payment → confirmed → processing → shipped → delivered`.
- If `tracking_number` and `carrier` are set, displays "Track on carrier" link.
- Accessible without login if URL is known (token in URL is the order number; further hardening optional).

### 6.5 Email Notifications
Powered by Resend, queued via pgmq.

**Templates** (in `supabase/functions/_shared/transactional-email-templates/`):
1. `order-placed-customer.tsx`
   - Subject: `Order ${orderNumber} confirmed — Korasutra`
   - Recipient: customer email (skipped if absent).
   - Content: thank-you, order summary, shipping address, total, **tracking link** (`https://korasutra.com/order-tracking/${orderNumber}`).
2. `order-placed-admin.tsx`
   - Subject: `🛒 New order ${orderNumber} — ₹${total}`
   - Recipient: `korasutra.official@gmail.com`.
   - Content: customer name, **phone, email, full address**, line items, **payment mode** (Razorpay/COD), payment status, total.
3. `order-shipped-customer.tsx`
   - Subject: `Your Korasutra order is on its way 📦`
   - Triggered when admin sets status to `shipped` and adds tracking info.
4. `order-delivered-customer.tsx`
   - Subject: `Delivered! Tell us what you think 💜`
   - Triggered on `delivered` status.

**Sender:** verified Resend sending domain on `korasutra.com` (e.g. `notify.korasutra.com`).

### 6.6 Admin Panel (`/admin`) — Redesigned

**Login:** username + password (existing default `korasutra_admin` / `KoraSutra@Admin2024`, bcrypt-hashed). Issues `admin_session` token sent as `x-admin-token` header.

**Layout:** Shadcn sidebar (collapsible to icon strip), top bar with sidebar trigger and admin name.

**Sections:**

#### 6.6.1 Dashboard
- KPIs: orders today, revenue today, pending fulfilment, low-stock count.
- Charts: revenue (last 30d), orders by status, top 5 SKUs.
- Live "New orders" feed (Supabase Realtime).

#### 6.6.2 Products
- Table: thumbnail, title, category, price, stock (sum across variants), status, actions.
- Search + filter by category / status.
- **Add / Edit Product form:**
  - Title (Title Case enforced)
  - Handle (auto-slugged, editable)
  - Category (Sarees / Blouses / …)
  - Has blouse piece (toggle) — when true and category is "Sarees", surfaces in Blouses catalog
  - Description (rich text, SEO-optimised)
  - Short description
  - Price + Compare-at price (both Poppins in UI)
  - Tags
  - Fabric, Technique, Color (used by recommendation engine)
  - **Images** — drag-drop upload to Supabase Storage, **max 5**, reorderable
  - **SEO** — SEO title, SEO description (live SERP preview)
  - **Variants** — repeating block: SKU, option1 (Color), option2 (Size), price override, inventory qty, track inventory toggle
  - Status: active / draft / archived

#### 6.6.3 Inventory
- Table: SKU, product, current qty, last movement, low-stock flag (≤ 2).
- Inline qty adjust with reason (restock / adjustment) → writes `inventory_movements`.
- Bulk CSV import / export.

#### 6.6.4 Orders
- Table: order #, date, customer name, **phone**, total, **payment mode**, payment status, fulfilment status.
- Realtime row insertion (no refresh needed).
- Filters: status, payment method, date range.
- **Order detail drawer:**
  - Customer block: name, **phone, email, full shipping address**.
  - Line items with thumbnails.
  - Money breakdown.
  - **Status updater** (dropdown): `pending_payment / confirmed / processing / shipped / delivered / cancelled / refunded`.
  - **Tracking fields:** carrier, tracking number, tracking URL — saving auto-emails the customer when status flips to `shipped`.
  - Internal notes (admin-only).

#### 6.6.5 Customers
- Table: name, phone, email, orders count, lifetime value, last order date.
- Detail view: profile + saved addresses + order history.

#### 6.6.6 Sales
- Date-range revenue, AOV, conversion (orders / unique sessions if tracked).
- Export CSV.

### 6.7 Migration from Shopify
One-time edge function `migrate-shopify-products` (run once by admin from `/admin/migrate`):
1. Pull all Shopify products via Storefront API (paginated).
2. For each product:
   - Insert `products` row (handle, title, description, SEO, price, compare_at_price, category, blouse flag inferred from tags/title).
   - Download up to 5 images → upload to Supabase Storage `product-images` bucket → insert `product_images`.
   - For each variant: insert `product_variants` (SKU, options, price, inventory_qty from Shopify availability).
3. Idempotent: re-runnable; matches by `handle`, updates in place.
4. Reports: `{ created, updated, failed }` with per-product errors.

After successful migration the storefront switches data source from `lib/shopify.ts` → new `lib/catalog.ts` (Supabase reads). Same TypeScript shape preserved so PDP / Collection / FeaturedProducts components compile unchanged.

### 6.8 Cutover
- **Strategy:** replace immediately, iterate live (per user decision).
- **Sequence:**
  1. Apply DB migration.
  2. Deploy edge functions (with placeholder Razorpay/AISensy keys returning friendly errors until secrets are added).
  3. Run `migrate-shopify-products`.
  4. Swap `lib/shopify.ts` calls to `lib/catalog.ts` in storefront components.
  5. Replace cart `createStorefrontCheckout` with `/checkout` route.
  6. Replace `OrderTracking` redirect with internal page.
  7. Rebuild `/admin`.
  8. User adds AISensy + Razorpay secrets → flows go live.
  9. Disconnect Shopify, remove Shopify SDK, clean secrets.

---

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | PDP TTI < 2s on 4G mid-tier mobile. Realtime order push < 2s. |
| **Security** | All secrets server-side. HMAC verification on Razorpay webhook. Rate-limited OTP. RLS on every table. Bcrypt for admin + OTP. No `localStorage` admin tokens (use `sessionStorage` + httpOnly is preferred but falls back to opaque token rotation). |
| **Reliability** | Atomic order placement (single edge function transaction). Email queue with retry + DLQ (built-in). |
| **SEO** | Preserve `/products/:handle` URLs. JSON-LD Product schema retained. Sitemap regenerated nightly from `products` table. |
| **Accessibility** | Keyboard navigable checkout, ARIA labels on form fields, color contrast AA. |
| **Mobile** | Sticky checkout CTA, single-column forms, 44px touch targets. |
| **Compliance** | Razorpay handles PCI. GDPR-style data export on request (manual v1). T&C, Privacy, Returns, Shipping pages preserved. |

---

## 8. Secrets Required

| Secret | Source | Used by |
|---|---|---|
| `AISENSY_API_KEY` | AISensy dashboard | `aisensy-send-otp` |
| `AISENSY_CAMPAIGN_NAME` | AISensy dashboard | `aisensy-send-otp` |
| `RAZORPAY_KEY_ID` | Razorpay dashboard | client + edge functions |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard | `razorpay-create-order`, `razorpay-verify` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay dashboard | webhook handler |
| `RESEND_API_KEY` | Resend dashboard | `send-order-emails`, order status emails |
| `RESEND_FROM_EMAIL` | Resend verified domain | transactional email sender |
| `RESEND_REPLY_TO_EMAIL` | support inbox | reply-to header |
| `ADMIN_NOTIFICATION_EMAIL` | constant | `korasutra.official@gmail.com` |

User provides AISensy, Razorpay, and Resend keys later; server-side functions are scaffolded with placeholders that return `503 service_not_configured` until keys are added.

---

## 9. Edge Functions

| Function | Auth | Purpose |
|---|---|---|
| `aisensy-send-otp` | none | Generate OTP, store hash, send WhatsApp template. |
| `aisensy-verify-otp` | none | Verify OTP, upsert customer, issue session token. |
| `customer-logout` | session | Invalidate session token. |
| `razorpay-create-order` | session | Create Razorpay order, return order_id + amount. |
| `razorpay-verify` | session | HMAC verify Razorpay signature. |
| `razorpay-webhook` | none (HMAC) | Mark payments paid/failed asynchronously. |
| `place-order` | session | Atomically write order, decrement inventory, enqueue emails. |
| `update-order-status` | admin | Admin status changes; triggers shipped/delivered emails. |
| `admin-login` | none | Bcrypt password check, issue admin_session. |
| `admin-logout` | admin | Invalidate admin_session. |
| `admin-create-product` / `update-product` / `delete-product` | admin | Catalog mutations + image storage cleanup. |
| `admin-adjust-inventory` | admin | Writes `inventory_movements` + updates variant qty. |
| `migrate-shopify-products` | admin | One-time Shopify → Supabase migration. |

---

## 10. Storage Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `product-images` | yes | Product gallery images, max 5 per product. |
| `email-assets` | yes | Logos used in transactional emails. |

---

## 11. Open Questions

1. **Shipping rates** — flat free shipping vs PIN-based slabs? Current memory says "FREE Delivery on all orders" → keep flat free for v1.
2. **Coupons / discounts** — preserve `FIRST10` first-time-buyer 10% off? Yes — implement `discount_codes` table in v1.1.
3. **Refunds via Razorpay API** — manual in admin v1, Razorpay refund API in v1.1.
4. **Multi-admin** — single admin sufficient for v1 or do we provision staff accounts via `user_roles` from day one? Schema supports both; UI ships single-admin v1.
5. **Order cancellation by customer** — allow until status = `processing`? Defer to v1.1.

---

## 12. Rollout Plan

| Phase | Scope | Status |
|---|---|---|
| **0** | DB migration + schema (`db/migration.sql`) | drafted ✅ |
| **1** | Edge functions scaffolded (placeholder behaviour for AISensy/Razorpay) | pending |
| **2** | Shopify → Supabase migration script + run | pending |
| **3** | Storefront swap to Supabase catalog | pending |
| **4** | Custom `/checkout` + Razorpay/COD integration | pending |
| **5** | Order tracking page + email templates | pending |
| **6** | Admin panel rebuild (sidebar, products, orders, inventory, customers, sales) | pending |
| **7** | Secrets added by user → live mode | pending |
| **8** | Disconnect Shopify, remove SDK, retire MSG91 | pending |

---

## 13. Success Metrics
- 100% of existing Shopify products migrated with zero data loss.
- Checkout completion rate ≥ Shopify baseline within 30 days.
- OTP send→verify success rate ≥ 90%.
- Admin time-to-fulfil (order placed → marked shipped) ≤ existing baseline.
- Zero direct DB writes from the browser (everything via edge functions / RLS-guarded reads).

---

*End of PRD.*
