import { describe, expect, test } from "bun:test";
import { productMatchesCollectionQuery } from "./collectionProductFilters";

describe("collection product filters", () => {
  test("matches products by admin-selected catalog tags even when the title is generic", () => {
    expect(productMatchesCollectionQuery({
      title: "Signature Saree",
      description: "",
      tags: ["fabric:linen"],
    }, "linen")).toBe(true);
  });

  test("matches display query labels to stored catalog tag slugs", () => {
    expect(productMatchesCollectionQuery({
      title: "Handcrafted Saree",
      description: "",
      tags: ["pattern:block-print", "occasion:party-wear"],
    }, "block print")).toBe(true);
  });
});
