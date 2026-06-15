import { describe, expect, test } from "bun:test";
import {
  BLOUSE_SIZES,
  MAX_BLOUSE_VARIANTS,
  buildAdminProductVariants,
  createBlouseEditorState,
  createBlouseSizeRows,
  generateBlouseVariantRows,
  parseCustomOptionValues,
} from "./blouseVariants";

describe("blouse variants", () => {
  test("provides supported sizes and a bounded variant count", () => {
    expect(BLOUSE_SIZES).toEqual(["34", "36", "38", "40", "42", "44", "46"]);
    expect(MAX_BLOUSE_VARIANTS).toBe(250);
  });

  test("parses custom values in order and deduplicates case-insensitively", () => {
    expect(parseCustomOptionValues(" Sleeveless, Cap Sleeve, sleeveless, ,Full Sleeve "))
      .toEqual(["Sleeveless", "Cap Sleeve", "Full Sleeve"]);
  });

  test("restores all four option lists and independently stocked rows", () => {
    const state = createBlouseEditorState([
      {
        sku: "KS-BLOUSE-34-SL-H-Z",
        title: "34 / Sleeveless / Halter / Zip",
        option1_name: "Size",
        option1_value: "34",
        option2_name: "Sleeves",
        option2_value: "Sleeveless",
        option3_name: "Neck",
        option3_value: "Halter",
        option4_name: "Close Type",
        option4_value: "Zip",
        inventory_qty: 4,
      },
      {
        sku: "KS-BLOUSE-36-C-V-H",
        title: "36 / Cap Sleeve / V Neck / Hook",
        option1_name: "Size",
        option1_value: "36",
        option2_name: "Sleeves",
        option2_value: "Cap Sleeve",
        option3_name: "Neck",
        option3_value: "V Neck",
        option4_name: "Close Type",
        option4_value: "Hook",
        inventory_qty: 2,
      },
    ]);

    expect(state.sizeRows.find((row) => row.size === "34")?.enabled).toBe(true);
    expect(state.sizeRows.find((row) => row.size === "36")?.enabled).toBe(true);
    expect(state.optionInputs).toEqual({
      sleeves: "Sleeveless, Cap Sleeve",
      necks: "Halter, V Neck",
      closeTypes: "Zip, Hook",
    });
    expect(state.variantRows[0]).toMatchObject({
      size: "34",
      sleeves: "Sleeveless",
      neck: "Halter",
      closeType: "Zip",
      sku: "KS-BLOUSE-34-SL-H-Z",
      inventoryQty: "4",
    });
  });

  test("generates the four-dimensional Cartesian product", () => {
    const sizeRows = createBlouseSizeRows().map((row) => ({
      ...row,
      enabled: row.size === "34" || row.size === "36",
    }));

    const rows = generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows,
      optionInputs: {
        sleeves: "Sleeveless, Full Sleeve",
        necks: "Halter",
        closeTypes: "Zip, Hook",
      },
    });

    expect(rows).toHaveLength(8);
    expect(rows.map((row) => `${row.size}|${row.sleeves}|${row.neck}|${row.closeType}`))
      .toContain("36|Full Sleeve|Halter|Hook");
  });

  test("preserves saved SKU and stock by normalized combination key", () => {
    const sizeRows = createBlouseSizeRows().map((row) => ({
      ...row,
      enabled: row.size === "34",
    }));
    const savedRows = generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows,
      optionInputs: {
        sleeves: "Sleeveless",
        necks: "Halter",
        closeTypes: "Zip",
      },
    }).map((row) => ({ ...row, sku: "CUSTOM-SKU", inventoryQty: "9" }));

    const regenerated = generateBlouseVariantRows({
      handleSeed: "changed-seed",
      sizeRows,
      optionInputs: {
        sleeves: " sleeveless ",
        necks: "HALTER",
        closeTypes: "zip",
      },
      savedRows,
    });

    expect(regenerated[0]).toMatchObject({ sku: "CUSTOM-SKU", inventoryQty: "9" });
  });

  test("builds independently stocked payloads with four option pairs", () => {
    const sizeRows = createBlouseSizeRows().map((row) => ({
      ...row,
      enabled: row.size === "34",
    }));
    const blouseVariantRows = generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows,
      optionInputs: {
        sleeves: "Sleeveless",
        necks: "Halter",
        closeTypes: "Zip",
      },
    }).map((row) => ({ ...row, sku: "KS-RED-34-SL-H-Z", inventoryQty: "3.9" }));

    expect(buildAdminProductVariants({
      categorySlug: "blouses",
      handle: "red-blouse",
      sku: "",
      inventoryQty: "1",
      price: "2499",
      compareAtPrice: "2999",
      blouseSizeRows: sizeRows,
      blouseOptionInputs: {
        sleeves: "Sleeveless",
        necks: "Halter",
        closeTypes: "Zip",
      },
      blouseVariantRows,
    })).toEqual([{
      sku: "KS-RED-34-SL-H-Z",
      title: "34 / Sleeveless / Halter / Zip",
      option1Name: "Size",
      option1Value: "34",
      option2Name: "Sleeves",
      option2Value: "Sleeveless",
      option3Name: "Neck",
      option3Value: "Halter",
      option4Name: "Close Type",
      option4Value: "Zip",
      price: 2499,
      compareAtPrice: 2999,
      inventoryQty: 3,
      trackInventory: true,
      position: 0,
    }]);
  });

  test("rejects missing dimensions, duplicate SKUs, and excessive combinations", () => {
    const oneSize = createBlouseSizeRows().map((row) => ({
      ...row,
      enabled: row.size === "34",
    }));

    expect(() => generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows: oneSize,
      optionInputs: { sleeves: "", necks: "Halter", closeTypes: "Zip" },
    })).toThrow("Add at least one Sleeves value");

    const duplicateSkuRows = generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows: oneSize,
      optionInputs: { sleeves: "Sleeveless, Full Sleeve", necks: "Halter", closeTypes: "Zip" },
    }).map((row) => ({ ...row, sku: "DUPLICATE" }));

    expect(() => buildAdminProductVariants({
      categorySlug: "blouses",
      handle: "red-blouse",
      sku: "",
      inventoryQty: "1",
      price: "2499",
      compareAtPrice: "",
      blouseSizeRows: oneSize,
      blouseOptionInputs: { sleeves: "Sleeveless, Full Sleeve", necks: "Halter", closeTypes: "Zip" },
      blouseVariantRows: duplicateSkuRows,
    })).toThrow("Duplicate variant SKU: DUPLICATE");

    const allSizes = createBlouseSizeRows().map((row) => ({ ...row, enabled: true }));
    expect(() => generateBlouseVariantRows({
      handleSeed: "red-blouse",
      sizeRows: allSizes,
      optionInputs: {
        sleeves: Array.from({ length: 6 }, (_, index) => `Sleeve ${index}`).join(","),
        necks: Array.from({ length: 6 }, (_, index) => `Neck ${index}`).join(","),
        closeTypes: "Zip, Hook",
      },
    })).toThrow("Blouse products are limited to 250 variants");
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
      blouseOptionInputs: { sleeves: "", necks: "", closeTypes: "" },
      blouseVariantRows: [],
    })).toEqual([{
      sku: "KS-BLUE",
      title: "Default",
      price: 5000,
      compareAtPrice: null,
      inventoryQty: 2,
      trackInventory: true,
      position: 0,
    }]);
  });
});
