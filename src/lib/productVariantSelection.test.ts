import { describe, expect, test } from "bun:test";
import { findExactVariant } from "./productVariantSelection";

const variants = [{
  node: {
    id: "variant-1",
    selectedOptions: [
      { name: "Size", value: "34" },
      { name: "Sleeves", value: "Sleeveless" },
      { name: "Neck", value: "Halter" },
      { name: "Close Type", value: "Zip" },
    ],
  },
}, {
  node: {
    id: "variant-2",
    selectedOptions: [
      { name: "Size", value: "34" },
      { name: "Sleeves", value: "Full Sleeve" },
      { name: "Neck", value: "V Neck" },
      { name: "Close Type", value: "Hook" },
    ],
  },
}];

describe("product variant selection", () => {
  test("returns only an exact match for every required option", () => {
    expect(findExactVariant(variants, {
      Size: "34",
      Sleeves: "Sleeveless",
      Neck: "Halter",
      "Close Type": "Zip",
    }, ["Size", "Sleeves", "Neck", "Close Type"])?.id).toBe("variant-1");
  });

  test("rejects partial and cross-combination selections", () => {
    expect(findExactVariant(variants, {
      Size: "34",
      Sleeves: "Sleeveless",
    }, ["Size", "Sleeves", "Neck", "Close Type"])).toBeNull();

    expect(findExactVariant(variants, {
      Size: "34",
      Sleeves: "Sleeveless",
      Neck: "V Neck",
      "Close Type": "Zip",
    }, ["Size", "Sleeves", "Neck", "Close Type"])).toBeNull();
  });
});
