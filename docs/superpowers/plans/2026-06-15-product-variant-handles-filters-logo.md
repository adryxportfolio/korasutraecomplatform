# Product Variant Handles, Filters, And Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SKU-prefixed canonical product handles, four-dimensional independently stocked blouse variants, mixed Saree/Blouse collection filters, and the supplied Kora Sutra logo, then deploy the database, functions, and frontend.

**Architecture:** Put handle generation and blouse combination generation in small tested domain helpers. Extend the existing `product_variants` schema to four option pairs, update products by stable ID, resolve legacy handles through a redirect table, and reuse the existing storefront option/cart/order pipeline. Keep collection filtering in a tested pure helper and synchronize UI selections through URL parameters.

**Tech Stack:** React 18, TypeScript, Bun test, Supabase/Postgres migrations and Edge Functions, Vite, Vercel.

---

### Task 1: SKU-Prefixed Handle Domain

**Files:**
- Create: `src/lib/productHandles.ts`
- Create: `src/lib/productHandles.test.ts`

- [ ] Write failing tests proving:
  - `buildSkuPrefixedHandle("KS-RED-34", "Red Jamdani Blouse")` returns `ks-red-34-red-jamdani-blouse`.
  - blank SKU throws `A first variant SKU is required`.
  - normalized punctuation and repeated separators are removed.
  - `withHandleCollisionSuffix(handle, productId)` appends the first eight compact ID characters.
- [ ] Run `bun test src/lib/productHandles.test.ts` and confirm failure because the helper does not exist.
- [ ] Implement:

```ts
export function slugifyHandlePart(value: string) {
  return value.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSkuPrefixedHandle(sku: string, title: string) {
  const skuPart = slugifyHandlePart(sku);
  if (!skuPart) throw new Error("A first variant SKU is required");
  const titlePart = slugifyHandlePart(title);
  return [skuPart, titlePart].filter(Boolean).join("-");
}

export function withHandleCollisionSuffix(handle: string, productId: string) {
  return `${handle}-${productId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase()}`;
}
```

- [ ] Run the focused test and confirm it passes.

### Task 2: Four-Dimensional Blouse Combination Domain

**Files:**
- Replace: `src/lib/blouseVariants.ts`
- Replace: `src/lib/blouseVariants.test.ts`

- [ ] Write failing tests for:
  - comma-separated custom option parsing, trimming, order preservation, and case-insensitive deduplication.
  - extracting Size, Sleeves, Neck, and Close Type values from saved variants.
  - Cartesian generation of all four dimensions.
  - preservation of saved SKU and inventory by normalized combination key.
  - fallback SKU generation.
  - duplicate SKU rejection.
  - required values for every dimension.
  - the 250-combination limit.
  - non-blouse default variant behavior.
- [ ] Run `bun test src/lib/blouseVariants.test.ts` and confirm the new assertions fail against the current size-only helper.
- [ ] Implement these exported APIs:

```ts
export const BLOUSE_SIZES = ["34", "36", "38", "40", "42", "44", "46"] as const;
export const MAX_BLOUSE_VARIANTS = 250;
export type BlouseOptionLists = { sleeves: string[]; necks: string[]; closeTypes: string[] };
export type BlouseVariantRow = {
  key: string; size: string; sleeves: string; neck: string; closeType: string;
  sku: string; inventoryQty: string;
};

export function parseCustomOptionValues(value: string): string[];
export function createBlouseEditorState(savedVariants?: SavedProductVariant[]): {
  sizeRows: BlouseSizeRow[];
  optionInputs: { sleeves: string; necks: string; closeTypes: string };
  variantRows: BlouseVariantRow[];
};
export function generateBlouseVariantRows(input: {
  handleSeed: string;
  sizeRows: BlouseSizeRow[];
  optionInputs: { sleeves: string; necks: string; closeTypes: string };
  savedRows?: BlouseVariantRow[];
}): BlouseVariantRow[];
export function buildAdminProductVariants(input: BuildAdminProductVariantsInput): AdminProductVariantInput[];
```

- [ ] Ensure each blouse payload writes:

```ts
{
  title: `${size} / ${sleeves} / ${neck} / ${closeType}`,
  option1Name: "Size",
  option1Value: size,
  option2Name: "Sleeves",
  option2Value: sleeves,
  option3Name: "Neck",
  option3Value: neck,
  option4Name: "Close Type",
  option4Value: closeType,
}
```

- [ ] Run focused tests and confirm all pass.

### Task 3: Collection Product-Type And Blouse Attribute Filtering

**Files:**
- Modify: `src/lib/collectionProductFilters.ts`
- Modify: `src/lib/collectionProductFilters.test.ts`

- [ ] Add failing tests proving:
  - both `sarees` and `blouses` selected returns both product categories.
  - selecting only one type returns only that category.
  - available blouse attribute values are extracted from variant selected options.
  - values within Sleeves use OR matching.
  - Sleeves, Neck, and Close Type sections combine with AND matching.
  - sarees remain visible during blouse-attribute filtering when Sarees remains selected.
- [ ] Run `bun test src/lib/collectionProductFilters.test.ts` and confirm failures.
- [ ] Extend `CollectionProductSearchFields` with storefront variants and implement:

```ts
export type ProductTypeFilter = "sarees" | "blouses";
export type BlouseAttributeFilters = {
  sleeves: string[];
  necks: string[];
  closeTypes: string[];
};

export function productMatchesProductTypes(product, selectedTypes): boolean;
export function blouseAttributeOptions(products): BlouseAttributeFilters;
export function productMatchesBlouseAttributes(product, filters, selectedTypes): boolean;
```

- [ ] Run the focused tests and confirm they pass.

### Task 4: Database Migration And Generated Types

**Files:**
- Create through CLI: `supabase/migrations/<timestamp>_product_variant_options_and_handle_redirects.sql`
- Modify: `src/integrations/supabase/types.ts`

- [ ] Run `supabase --version` and `supabase migration new product_variant_options_and_handle_redirects`.
- [ ] Add migration SQL that:
  - adds `option3_name`, `option3_value`, `option4_name`, and `option4_value` to `product_variants`.
  - creates `product_handle_redirects(old_handle text primary key, product_id uuid not null references products(id) on delete cascade, created_at timestamptz not null default now())`.
  - creates an index on `product_id`.
  - enables RLS.
  - grants `select` to `anon`, `authenticated`, and `service_role`.
  - grants mutations to `service_role`.
  - adds a public select policy.
  - backfills blank first variant SKUs deterministically.
  - records all current handles.
  - computes SKU-prefixed handles, appending an eight-character product ID suffix on collisions.
  - updates `reviews.product_handle` using `reviews.product_id`.
- [ ] Update the local generated type declarations for the redirect table and new variant option columns used by the app.
- [ ] Run `supabase db lint --local` when a local stack is available; otherwise run SQL parsing through the linked push dry-run facilities exposed by the installed CLI and inspect the migration manually.

### Task 5: Catalog Mapping And Legacy Handle Resolution

**Files:**
- Modify: `src/lib/shopify.ts`
- Modify: `src/lib/shopify.test.ts`
- Modify: `src/lib/localCommerce.ts`
- Modify: `src/lib/localCommerce.test.ts`

- [ ] Add failing catalog tests proving option 3 and option 4 become `selectedOptions` and ordered product options.
- [ ] Add a failing redirect-resolution test around an injectable resolver helper that returns the current canonical handle.
- [ ] Run the focused tests and confirm failures.
- [ ] Extend catalog row types/selects and local-commerce mappings for all four option pairs.
- [ ] Change `fetchProductByHandle` to return:

```ts
type ProductHandleResult = {
  product: ShopifyProduct["node"] | null;
  canonicalHandle: string | null;
};
```

- [ ] Resolve current handles first, then query `product_handle_redirects` and load the linked active product.
- [ ] Preserve local fallback behavior and allow local products to carry `previous_handles`.
- [ ] Run focused catalog and local-commerce tests.

### Task 6: Admin Product Editor And Stable-ID Save

**Files:**
- Modify: `src/pages/Admin.tsx`
- Modify: `src/lib/localCommerce.ts`
- Modify: `supabase/functions/admin-commerce/index.ts`

- [ ] Add product form fields:

```ts
id: string;
previousHandle: string;
blouseOptionInputs: { sleeves: string; necks: string; closeTypes: string };
blouseVariantRows: BlouseVariantRow[];
```

- [ ] Recompute combination rows whenever enabled sizes or custom option inputs change, preserving matching saved rows.
- [ ] Render three comma-separated custom option inputs and the generated combination table with SKU and inventory fields.
- [ ] Display projected combination count and the 250 limit.
- [ ] Generate the read-only handle preview from the first generated variant SKU and product title.
- [ ] Include `id` and `previousHandle` in the save payload.
- [ ] Edit products by stable ID in local storage and the Edge Function.
- [ ] In `admin-commerce`, validate every variant and SKU before deleting old variants.
- [ ] For existing products:
  - fetch the current row by ID.
  - insert its old handle into `product_handle_redirects` when changed.
  - update the product row by ID.
- [ ] For new products, insert with the generated handle.
- [ ] Write option 3 and option 4 fields on every variant.
- [ ] Keep single SKU/inventory controls for non-blouses.

### Task 7: Product Detail Canonical URL And Exact Combination Selection

**Files:**
- Modify: `src/pages/ProductDetail.tsx`
- Create: `src/lib/productVariantSelection.ts`
- Create: `src/lib/productVariantSelection.test.ts`

- [ ] Write failing tests proving exact matching requires all product option names and rejects partial stale selections.
- [ ] Implement:

```ts
export function findExactVariant(variants, options, requiredOptionNames) {
  if (requiredOptionNames.some((name) => !options[name])) return null;
  return variants.find(({ node }) =>
    requiredOptionNames.every((name) =>
      node.selectedOptions.some((option) => option.name === name && option.value === options[name])
    )
  )?.node ?? null;
}
```

- [ ] Update product loading for the new handle result and call `navigate("/products/<canonical>", { replace: true })` when a legacy handle resolves.
- [ ] Reset selected options when the product changes.
- [ ] Select and purchase only the exact four-option variant.
- [ ] Disable purchase actions and show `Select all options` when no exact combination is selected.
- [ ] Run the selection tests.

### Task 8: Collection Filter UI And URL State

**Files:**
- Modify: `src/pages/Collection.tsx`

- [ ] Add URL parameters:

```txt
types=sarees,blouses
sleeves=Sleeveless,Cap Sleeve
necks=Halter,V Neck
closeTypes=Zip,Hook
```

- [ ] Default `types` to both values when absent.
- [ ] Load `/collections/all` without category scoping so both types appear by default.
- [ ] Add Product Type checkboxes selected by default.
- [ ] Derive and render Sleeves, Neck, and Close Type filter sections from current blouse variants.
- [ ] Apply the tested helper semantics, active chips, counts, clear actions, and URL persistence.
- [ ] Keep blouse routes scoped to blouses and saree-specific routes scoped to sarees.
- [ ] On mixed collection cards, avoid adding a multi-option blouse directly from the grid; link to product selection instead.

### Task 9: Logo Conversion And Brand References

**Files:**
- Replace: `public/logo.png`
- Replace: `public/favicon.png`
- Replace: `public/favicon.ico`
- Modify: `src/lib/brandAssets.ts`
- Modify: `src/lib/brandAssets.test.ts`
- Modify: `src/pages/Index.tsx`
- Modify: `src/pages/JournalArticle.tsx`
- Modify: `src/lib/seo.ts`

- [ ] Add a failing brand-assets test proving visible and structured-data logo URLs use the shared exported paths.
- [ ] Render the first PDF page at high resolution.
- [ ] Detect the uniform cream background, crop to artwork bounds with padding, remove only connected/background-colored pixels, and export an optimized transparent PNG.
- [ ] Create a square favicon PNG and ICO from the same supplied artwork.
- [ ] Update `brandAssets.ts` to export the website logo and structured-data logo URLs.
- [ ] Replace hard-coded favicon structured-data references.
- [ ] Inspect the converted logo with `view_image`.
- [ ] Run the brand-assets test.

### Task 10: Full Verification

**Files:**
- Review all modified files.

- [ ] Run focused tests:

```powershell
bun test src/lib/productHandles.test.ts src/lib/blouseVariants.test.ts src/lib/collectionProductFilters.test.ts src/lib/productVariantSelection.test.ts src/lib/shopify.test.ts src/lib/localCommerce.test.ts src/lib/brandAssets.test.ts
```

- [ ] Run `bun test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Start the production build locally.
- [ ] Verify with Browser/IAB; if unavailable, use headless Chrome screenshots and DOM/accessibility checks as the documented fallback.
- [ ] Check desktop and mobile:
  - logo in header, drawer, footer, and favicon.
  - admin custom blouse option generation.
  - four-option product selection.
  - exact stock behavior.
  - Product Type and blouse attribute collection filters.
  - old handle canonical replacement.

### Task 11: Deploy Supabase, Commit, Push, And Deploy Frontend

**Files:**
- Review deployment output only.

- [ ] Run the repository Supabase deployment script so migrations and `admin-commerce` deploy before the frontend.
- [ ] Verify the linked project reports no pending migration and the updated function is active.
- [ ] Inspect `git status` and `git diff --stat`; stage only this feature.
- [ ] Commit with a concise feature message.
- [ ] Push `main` to `origin`.
- [ ] Deploy production through the linked Vercel project with `npx vercel deploy --prod --yes`.
- [ ] Inspect the production deployment status and URL.
- [ ] Smoke-test `https://korasutra.com` and the deployed URL for branding, collections, product selection, and an old-handle redirect.
