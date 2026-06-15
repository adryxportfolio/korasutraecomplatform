# Product Variant Handles, Filters, And Logo Design

## Goal

Make every product URL unique by prefixing its handle with the first variant SKU, expand blouse products into independently stocked combinations of Size, Sleeves, Neck, and Close Type, add Saree/Blouse and blouse-attribute collection filters, and replace the website branding with the supplied Kora Sutra logo.

## Product Handles

Product handles use this normalized format:

`<first-variant-sku>-<product-title>`

For example, first variant SKU `KS-RJB-34-SL-HN-ZIP` and title `Red Jamdani Blouse` produce:

`ks-rjb-34-sl-hn-zip-red-jamdani-blouse`

The admin handle field is generated and read-only. Its preview updates when the title or first variant SKU changes.

Existing products are updated by stable product ID rather than handle. This prevents an edited handle from creating a duplicate product. New products continue to insert normally.

All existing product handles are migrated to the new format using their first variant by position. Products without a usable variant SKU receive the existing generated SKU before the handle is built.

## Handle Redirects

A `product_handle_redirects` table stores each previous handle and its product ID. The table has:

- `old_handle`, unique and required
- `product_id`, referencing `products(id)` with cascade delete
- `created_at`

Product lookup first checks the current `products.handle`. When no current product matches, it resolves the old handle through the redirect table and loads the linked product. The storefront then replaces the browser URL with the current canonical handle.

When an administrator changes a handle again, the immediately previous handle is inserted into the redirect table. Existing redirects remain valid.

Review rows that reference an old product handle are updated during the initial migration. Historical order items remain immutable because they already store product titles, SKUs, and variant descriptions as snapshots.

The redirect table is readable through the public Data API only for the product-resolution query. Row Level Security is enabled, and an explicit select policy plus the required `anon` and `authenticated` grants are included because current Supabase projects no longer expose new public tables automatically.

## Blouse Variant Model

Blouse products have four purchasable option dimensions:

1. Size
2. Sleeves
3. Neck
4. Close Type

The existing `product_variants` table gains:

- `option3_name`
- `option3_value`
- `option4_name`
- `option4_value`

The fixed blouse sizes remain `34`, `36`, `38`, `40`, `42`, `44`, and `46`. Administrators enter custom values for Sleeves, Neck, and Close Type for each product.

Every selected value combination becomes a real variant row. For example:

`34 / Sleeveless / Halter / Zip`

Each row has its own editable SKU and inventory quantity. Its option fields are:

- `option1_name = "Size"`
- `option1_value = "34"`
- `option2_name = "Sleeves"`
- `option2_value = "Sleeveless"`
- `option3_name = "Neck"`
- `option3_value = "Halter"`
- `option4_name = "Close Type"`
- `option4_value = "Zip"`

The variant title is the four values joined with ` / `.

## Admin Workflow

The blouse editor keeps the existing fixed size toggles and adds custom value inputs for Sleeves, Neck, and Close Type. Values are entered as comma-separated lists, trimmed, deduplicated case-insensitively, and kept in administrator-entered order.

The form generates a combination table from the selected sizes and three custom lists. Every combination row exposes:

- Combination title
- SKU
- Inventory quantity

When editing an existing blouse, the option lists are reconstructed from saved variants. Matching combinations retain their existing SKU and inventory even when option values are reordered or new values are added.

A blouse cannot be saved unless it has at least one selected size and at least one non-empty value for Sleeves, Neck, and Close Type.

The combination count is capped at 250 variants per product. The admin shows the projected count before saving and blocks generation with a clear message when the cap is exceeded.

Generated fallback SKUs use the product handle seed plus normalized option values. Duplicate SKUs and duplicate normalized combinations are rejected before upload or database mutation.

Non-blouse products retain one default variant with the existing SKU and inventory controls.

## Storefront Selection

Catalog mapping reads all four option pairs and exposes them as ordered product options. Product detail pages render Size, Sleeves, Neck, and Close Type selectors using the existing option-selection UI.

The initial state may display the first available values, but a blouse cannot be added to cart or purchased until all four option dimensions have an exact matching variant. Availability and stock come from that exact variant row.

Changing an option selects the matching combination. Out-of-stock combinations remain visible through their values but cannot be purchased.

Cart, checkout, thank-you, customer order history, admin orders, inventory rows, order emails, and WhatsApp messages preserve the selected variant title and SKU. The full variant title communicates all four selected values without changing historical order schemas.

## Collection Filters

The collection drawer gains a `Product Type` section with:

- Sarees
- Blouses

Both are selected by default, so the all-products collection includes both product types. Shoppers can deselect either type. The blouse collection route remains scoped to blouses, and saree-specific routes remain scoped to sarees.

The drawer also gains blouse-specific sections populated from current blouse variants:

- Sleeves
- Neck
- Close Type

Selecting values within one section uses OR matching. Different sections use AND matching. For example, `Sleeveless` plus `Halter` matches blouse products that have at least one variant containing both values, regardless of size or close type.

Blouse attribute filters affect blouse products only. Sarees remain visible when Sarees is selected unless the shopper explicitly deselects Sarees. This prevents selecting a blouse attribute from unexpectedly hiding all sarees in a mixed collection.

Filter selections are represented in URL query parameters so filtered collection links are shareable and survive refreshes.

## Logo Assets

The supplied `Korasutra -Sizereframelogo.pdf` is the source of truth. The square logo is exported at web-ready resolution, tightly cropped around the artwork, and given a transparent background where the PDF background is uniform.

The optimized asset replaces the current shared logo used by:

- Desktop and mobile navbar
- Navigation drawer
- Footer
- Favicon and Apple touch icon
- Organization and article structured-data logo references

The full logo remains readable at header sizes. A square favicon variant uses the same artwork rather than a different brand mark.

## Data And API Changes

The Supabase migration:

1. Adds option 3 and option 4 columns to `product_variants`.
2. Creates and secures `product_handle_redirects`.
3. Backfills missing first-variant SKUs when necessary.
4. Inserts current handles into the redirect table.
5. Rebuilds every product handle from the first variant SKU and title.
6. Updates review handles to the new current handles.

The migration is idempotent where practical and uses deterministic collision handling. If two normalized handles collide despite SKU prefixes, a short product-ID suffix is appended to the later row.

The admin commerce function accepts `product.id`. Existing products are updated by ID, while new products are inserted. Before changing an existing handle, the function stores the previous handle as a redirect. Variant replacement remains transactional in behavior at the application level: validation completes before old variants are deleted.

All catalog select lists, local-commerce fallback records, CSV imports, feed generation, and generated Supabase types are updated for option 3 and option 4.

## Error Handling

- Missing blouse option dimensions produce a field-specific admin error.
- More than 250 generated combinations is rejected before saving.
- Duplicate option values are normalized and deduplicated.
- Duplicate SKUs produce a clear error before database writes.
- A missing first variant blocks handle generation until a valid variant exists.
- Redirect lookup failure preserves the existing not-found behavior.
- A migration collision receives a deterministic product-ID suffix rather than failing the deployment.
- Logo conversion failure leaves the existing asset untouched until a verified replacement is ready.

## Testing

Unit tests cover:

- SKU-prefixed handle generation and normalization
- Handle collision suffixes
- Redirect resolution
- Custom option parsing and deduplication
- Four-dimensional Cartesian combination generation
- Preservation of existing SKU and stock by normalized combination key
- Combination count limits
- Duplicate SKU validation
- Four-option catalog mapping
- Exact variant matching and stock availability
- Product-type collection defaults
- Blouse attribute filter semantics
- Logo URL and metadata references

Migration verification covers the new columns, redirect grants/RLS, handle backfill, and review-handle updates.

End-to-end verification covers:

- Creating and editing a blouse with multiple combinations
- Handle preview and saved URL
- Resolving an old product URL to the canonical URL
- Selecting all four options and adding the exact variant to cart
- Displaying the full selected variation throughout checkout and admin orders
- Filtering mixed collections by product type and blouse attributes
- Navbar, drawer, footer, and favicon branding on desktop and mobile

The full test suite, lint, production build, migration checks, and browser-based smoke tests run before commit, push, and production deployment.

## Deployment

Schema migrations and Edge Function changes are deployed before or alongside the frontend so the frontend never queries missing variant columns. The production sequence is:

1. Verify migrations and application tests locally.
2. Deploy the Supabase migration and updated functions.
3. Build the frontend.
4. Commit the implementation.
5. Push `main` to GitHub.
6. Deploy the production frontend.
7. Smoke-test canonical and redirected product URLs, blouse purchase selection, collection filters, and branding.
