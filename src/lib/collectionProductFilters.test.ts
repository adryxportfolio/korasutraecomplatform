import { describe, expect, test } from "bun:test";
import {
  blouseAttributeOptions,
  productHasSareeBlousePiece,
  productMatchesBlouseAttributes,
  productMatchesCollectionQuery,
  productMatchesCollectionScope,
  productMatchesProductTypes,
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

  test("shows both product categories on all-products while saree routes stay scoped", () => {
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
    }, "all")).toBe(true);

    expect(productMatchesCollectionScope({
      title: "Standalone Blouse",
      category: { slug: "blouses", name: "Blouses" },
    }, "cotton")).toBe(false);
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

  test("shows both product types by default and allows either type alone", () => {
    const saree = { category: { slug: "sarees", name: "Sarees" } };
    const blouse = { category: { slug: "blouses", name: "Blouses" } };

    expect(productMatchesProductTypes(saree, ["sarees", "blouses"])).toBe(true);
    expect(productMatchesProductTypes(blouse, ["sarees", "blouses"])).toBe(true);
    expect(productMatchesProductTypes(saree, ["blouses"])).toBe(false);
    expect(productMatchesProductTypes(blouse, ["blouses"])).toBe(true);
  });

  test("extracts custom blouse attribute values from variants", () => {
    expect(blouseAttributeOptions([{
      category: { slug: "blouses", name: "Blouses" },
      variants: [{
        selectedOptions: [
          { name: "Size", value: "34" },
          { name: "Sleeves", value: "Sleeveless" },
          { name: "Neck", value: "Halter" },
          { name: "Close Type", value: "Zip" },
        ],
      }, {
        selectedOptions: [
          { name: "Size", value: "36" },
          { name: "Sleeves", value: "Full Sleeve" },
          { name: "Neck", value: "V Neck" },
          { name: "Close Type", value: "Hook" },
        ],
      }],
    }])).toEqual({
      sleeves: ["Sleeveless", "Full Sleeve"],
      necks: ["Halter", "V Neck"],
      closeTypes: ["Zip", "Hook"],
    });
  });

  test("uses OR within blouse attributes, AND across sections, and keeps selected sarees", () => {
    const blouse = {
      category: { slug: "blouses", name: "Blouses" },
      variants: [{
        selectedOptions: [
          { name: "Sleeves", value: "Sleeveless" },
          { name: "Neck", value: "Halter" },
          { name: "Close Type", value: "Zip" },
        ],
      }, {
        selectedOptions: [
          { name: "Sleeves", value: "Full Sleeve" },
          { name: "Neck", value: "V Neck" },
          { name: "Close Type", value: "Hook" },
        ],
      }],
    };
    const saree = { category: { slug: "sarees", name: "Sarees" }, variants: [] };

    expect(productMatchesBlouseAttributes(blouse, {
      sleeves: ["Cap Sleeve", "Sleeveless"],
      necks: ["Halter"],
      closeTypes: [],
    }, ["sarees", "blouses"])).toBe(true);

    expect(productMatchesBlouseAttributes(blouse, {
      sleeves: ["Sleeveless"],
      necks: ["V Neck"],
      closeTypes: [],
    }, ["sarees", "blouses"])).toBe(false);

    expect(productMatchesBlouseAttributes(saree, {
      sleeves: ["Sleeveless"],
      necks: [],
      closeTypes: [],
    }, ["sarees", "blouses"])).toBe(true);

    expect(productMatchesBlouseAttributes(saree, {
      sleeves: ["Sleeveless"],
      necks: [],
      closeTypes: [],
    }, ["blouses"])).toBe(false);
  });
});
