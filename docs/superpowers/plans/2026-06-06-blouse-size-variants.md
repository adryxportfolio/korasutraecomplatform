# Blouse Size Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independently stocked sizes 34-46 to blouse products and preserve the purchased size through storefront and admin order views.

**Architecture:** Store each blouse size in the existing `product_variants` table using the `Size` option. Put size normalization and payload generation in a small tested helper, then connect that helper to the existing admin form and existing storefront variant flow.

**Tech Stack:** React 18, TypeScript, Zustand, Bun test, Supabase/Postgres product variants, Supabase Edge Functions.

---

### Task 1: Blouse Variant Domain Helper

**Files:**
- Create: `src/lib/blouseVariants.ts`
- Create: `src/lib/blouseVariants.test.ts`

- [ ] Write failing tests for the supported size list, restoring saved variants, generating one payload per selected size, SKU fallback, inventory normalization, and rejecting an empty selection.
- [ ] Run `bun test src/lib/blouseVariants.test.ts` and confirm the tests fail because the helper does not exist.
- [ ] Implement `BLOUSE_SIZES`, `createBlouseSizeRows`, and `buildAdminProductVariants`.
- [ ] Run `bun test src/lib/blouseVariants.test.ts` and confirm all helper tests pass.

### Task 2: Admin Product Editor

**Files:**
- Modify: `src/pages/Admin.tsx`

- [ ] Add blouse size rows to product form state and reset behavior.
- [ ] Replace the single variant payload with `buildAdminProductVariants`.
- [ ] Restore every saved blouse size variant during edit.
- [ ] Render selectable per-size SKU and inventory controls only for the `blouses` category.
- [ ] Keep existing single SKU and inventory controls for non-blouse products.
- [ ] Display variant size in the inventory table and purchased size in expanded order details.

### Task 3: Storefront Size Visibility

**Files:**
- Modify: `src/pages/Checkout.tsx`
- Modify: `src/pages/ThankYou.tsx`
- Test: `src/lib/shopify.test.ts`

- [ ] Add a failing catalog mapping assertion proving saved size variants produce a `Size` option with ordered values.
- [ ] Run `bun test src/lib/shopify.test.ts` and confirm the assertion fails before fixture completion.
- [ ] Keep the existing product-detail option selector and add selected size text to checkout and thank-you summaries.
- [ ] Run `bun test src/lib/shopify.test.ts` and confirm catalog mapping passes.

### Task 4: Order Communication

**Files:**
- Modify: `supabase/functions/admin-commerce/index.ts`

- [ ] Include `variant_title` in order-update email line items so customer communication preserves the purchased size.
- [ ] Verify the admin order UI and email both use the immutable order-item snapshot rather than current product data.

### Task 5: Full Verification And Delivery

**Files:**
- Review all modified files.

- [ ] Run `bun test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the local app and validate admin blouse size editing plus storefront size selection with the Browser plugin.
- [ ] Run `git diff --check` and inspect `git diff`.
- [ ] Commit the complete feature.
- [ ] Push `main` to `origin`.
