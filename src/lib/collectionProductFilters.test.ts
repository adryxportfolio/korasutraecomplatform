import { describe, expect, test } from "bun:test";
import {
  productHasSareeBlousePiece,
  productMatchesCollectionQuery,
  productMatchesCollectionScope,
} from "./collectionProductFilters";

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

  test("matches blouse collections only to admin-selected blouse categories", () => {
    expect(productMatchesCollectionQuery({
      title: "Blue Saree With Blouse Piece",
      description: "Includes running blouse piece",
      category: { slug: "sarees", name: "Sarees" },
      tags: ["with blouse"],
    }, "blouse")).toBe(false);

    expect(productMatchesCollectionQuery({
      title: "Red Sleeveless Top",
      description: "",
      category: { slug: "blouses", name: "Blouses" },
    }, "blouse")).toBe(true);
  });

  test("keeps blouse-category products out of saree collection queries", () => {
    expect(productMatchesCollectionQuery({
      title: "Cotton Blouse",
      description: "",
      fabric: "Cotton",
      category: { slug: "blouses", name: "Blouses" },
    }, "cotton")).toBe(false);

    expect(productMatchesCollectionQuery({
      title: "Cotton Saree With Blouse Piece",
      description: "Includes blouse piece",
      fabric: "Cotton",
      category: { slug: "sarees", name: "Sarees" },
      tags: ["with blouse"],
    }, "cotton")).toBe(true);
  });

  test("scopes saree collection pages to sarees while allowing both blouse-piece states", () => {
    expect(productMatchesCollectionScope({
      title: "Saree With Blouse Piece",
      category: { slug: "sarees", name: "Sarees" },
    }, "all")).toBe(true);

    expect(productMatchesCollectionScope({
      title: "Saree Without Blouse Piece",
      category: { slug: "sarees", name: "Sarees" },
    }, "all")).toBe(true);

    expect(productMatchesCollectionScope({
      title: "Standalone Blouse",
      category: { slug: "blouses", name: "Blouses" },
    }, "all")).toBe(false);
  });

  test("shows the blouse-piece badge only for saree products", () => {
    expect(productHasSareeBlousePiece({
      title: "Red Jamdani Blouse",
      description: "",
      category: { slug: "blouses", name: "Blouses" },
      tags: [],
    })).toBe(false);

    expect(productHasSareeBlousePiece({
      title: "Cotton Saree",
      description: "Includes running blouse piece",
      category: { slug: "sarees", name: "Sarees" },
      tags: ["with blouse"],
    })).toBe(true);
  });
});
