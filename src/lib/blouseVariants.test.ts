import { describe, expect, test } from "bun:test";
import {
  BLOUSE_SIZES,
  buildAdminProductVariants,
  createBlouseSizeRows,
} from "./blouseVariants";

describe("blouse size variants", () => {
  test("provides the supported blouse sizes in display order", () => {
    expect(BLOUSE_SIZES).toEqual(["34", "36", "38", "40", "42", "44", "46"]);
  });

  test("restores enabled sizes, SKUs, and inventory from saved variants", () => {
    const rows = createBlouseSizeRows([
      {
        sku: "KS-BLOUSE-36",
        title: "Size 36",
        option1_name: "Size",
        option1_value: "36",
        inventory_qty: 4,
      },
      {
        sku: "KS-BLOUSE-42",
        title: "Size 42",
        option1_name: "Size",
        option1_value: "42",
        inventory_qty: 2,
      },
    ]);

    expect(rows.find((row) => row.size === "36")).toEqual({
      size: "36",
      enabled: true,
      sku: "KS-BLOUSE-36",
      inventoryQty: "4",
    });
    expect(rows.find((row) => row.size === "42")).toEqual({
      size: "42",
      enabled: true,
      sku: "KS-BLOUSE-42",
      inventoryQty: "2",
    });
    expect(rows.find((row) => row.size === "34")?.enabled).toBe(false);
  });

  test("builds one independently stocked variant for each enabled blouse size", () => {
    const rows = createBlouseSizeRows().map((row) => {
      if (row.size === "34") return { ...row, enabled: true, inventoryQty: "3" };
      if (row.size === "38") return { ...row, enabled: true, sku: "CUSTOM-38", inventoryQty: "7.9" };
      return row;
    });

    expect(buildAdminProductVariants({
      categorySlug: "blouses",
      handle: "red-silk-blouse",
      sku: "",
      inventoryQty: "1",
      price: "2499",
      compareAtPrice: "2999",
      blouseSizeRows: rows,
    })).toEqual([
      {
        sku: "KS-RED-SILK-BLOUSE-34",
        title: "Size 34",
        option1Name: "Size",
        option1Value: "34",
        price: 2499,
        compareAtPrice: 2999,
        inventoryQty: 3,
        trackInventory: true,
        position: 0,
      },
      {
        sku: "CUSTOM-38",
        title: "Size 38",
        option1Name: "Size",
        option1Value: "38",
        price: 2499,
        compareAtPrice: 2999,
        inventoryQty: 7,
        trackInventory: true,
        position: 1,
      },
    ]);
  });

  test("keeps non-blouse products on one default variant", () => {
    expect(buildAdminProductVariants({
      categorySlug: "sarees",
      handle: "blue-saree",
      sku: "KS-BLUE",
      inventoryQty: "2",
      price: "5000",
      compareAtPrice: "",
      blouseSizeRows: createBlouseSizeRows(),
    })).toEqual([
      {
        sku: "KS-BLUE",
        title: "Default",
        price: 5000,
        compareAtPrice: null,
        inventoryQty: 2,
        trackInventory: true,
        position: 0,
      },
    ]);
  });

  test("rejects blouse products without an enabled size", () => {
    let message = "";

    try {
      buildAdminProductVariants({
        categorySlug: "blouses",
        handle: "red-silk-blouse",
        sku: "",
        inventoryQty: "1",
        price: "2499",
        compareAtPrice: "",
        blouseSizeRows: createBlouseSizeRows(),
      });
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }

    expect(message).toBe("Select at least one blouse size");
  });
});
