# Blouse Size Variants Design

## Goal

Allow administrators to create and edit blouse products with selectable sizes 34, 36, 38, 40, 42, 44, and 46. Each selected size is stored as a real product variant with its own SKU and inventory quantity, and the purchased size remains visible throughout the storefront and admin order workflow.

## Architecture

The existing `product_variants` table remains the source of truth. A blouse size is represented by one row with `option1_name = "Size"`, `option1_value` set to the numeric size, and a matching variant title. No database schema change is required.

A focused frontend helper owns the fixed size list, conversion of saved variants into admin form rows, and conversion of admin form rows into product variant payloads. This keeps the large admin page from duplicating variant rules.

## Admin Product Flow

- The category continues to determine whether a product is a blouse.
- Blouse products display all seven supported sizes.
- Each size can be enabled independently.
- Each enabled size has its own SKU and inventory quantity.
- Saving a blouse requires at least one enabled size.
- Editing a blouse restores the enabled sizes, SKUs, and inventory quantities from its saved variants.
- Non-blouse products retain the existing single default SKU and inventory fields.

## Storefront And Orders

- Product detail pages use the existing option renderer to show the `Size` choices.
- Selecting a size selects its corresponding variant and inventory availability.
- Cart and checkout summaries display the selected option values.
- Order placement continues to snapshot the selected variant title and SKU.
- Admin order details explicitly display the purchased size from `variant_title`.
- Admin inventory rows display each size next to its SKU.

## Error Handling

- Blouse saves fail with a clear message when no size is enabled.
- Inventory values are normalized to non-negative integers.
- Blank per-size SKUs are generated from the product handle and size.
- Out-of-stock sizes remain visible but cannot be purchased through their variant availability state.

## Testing

- Unit tests cover the fixed size set, restoration of existing variants, generated payloads, SKU fallback, and the no-size validation.
- Existing catalog mapping tests verify that size variants become storefront options.
- The full Bun test suite, lint, and production build run before commit.
- Browser validation covers admin editing and the storefront size selection flow when local data permits.
