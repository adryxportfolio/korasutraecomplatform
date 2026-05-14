import { describe, expect, test } from "bun:test";
import { buildAdminProductImages } from "./adminProductImages";

describe("admin product images", () => {
  test("builds an ordered multi-image gallery from stored URLs and uploaded files", () => {
    expect(buildAdminProductImages({
      title: "Pink Linen Saree",
      imageUrls: "https://cdn.example.com/front.jpg\nhttps://cdn.example.com/detail.jpg",
      uploadedImages: [
        { url: "https://cdn.example.com/pallu.jpg", storageKey: "products/pallu.jpg" },
      ],
    })).toEqual([
      { url: "https://cdn.example.com/front.jpg", altText: "Pink Linen Saree" },
      { url: "https://cdn.example.com/detail.jpg", altText: "Pink Linen Saree" },
      { url: "https://cdn.example.com/pallu.jpg", altText: "Pink Linen Saree", storageKey: "products/pallu.jpg" },
    ]);
  });

  test("removes duplicate or blank image entries", () => {
    expect(buildAdminProductImages({
      title: "Kantha Saree",
      imageUrls: " https://cdn.example.com/front.jpg \n\nhttps://cdn.example.com/front.jpg",
      uploadedImages: [{ url: "" }, { url: "https://cdn.example.com/front.jpg" }],
    })).toEqual([
      { url: "https://cdn.example.com/front.jpg", altText: "Kantha Saree" },
    ]);
  });
});
