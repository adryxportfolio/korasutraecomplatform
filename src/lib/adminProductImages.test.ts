import { describe, expect, test } from "bun:test";
import { buildAdminProductImages, findNonCloudinaryMediaUrls, findShopifyCdnMediaUrls } from "./adminProductImages";

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

  test("identifies Shopify CDN images and videos before product media is saved", () => {
    expect(findShopifyCdnMediaUrls({
      images: [
        { url: "https://res.cloudinary.com/kora/image/upload/front.jpg" },
        { url: "https://cdn.shopify.com/s/files/1/0800/5258/4666/files/front.jpg" },
      ],
      videos: [
        { url: "https://cdn.shopify.com/videos/c/o/v/video.mp4" },
        { url: "https://res.cloudinary.com/kora/video/upload/drape.mp4" },
      ],
    })).toEqual([
      "https://cdn.shopify.com/s/files/1/0800/5258/4666/files/front.jpg",
      "https://cdn.shopify.com/videos/c/o/v/video.mp4",
    ]);
  });

  test("identifies media that is not synced to Cloudinary", () => {
    expect(findNonCloudinaryMediaUrls({
      images: [
        { url: "https://res.cloudinary.com/kora/image/upload/front.jpg" },
        { url: "https://cdn.example.com/front.jpg" },
      ],
      videos: [
        { url: "https://res.cloudinary.com/kora/video/upload/drape.mp4" },
        { url: "https://cdn.shopify.com/videos/c/o/v/video.mp4" },
      ],
    })).toEqual([
      "https://cdn.example.com/front.jpg",
      "https://cdn.shopify.com/videos/c/o/v/video.mp4",
    ]);
  });
});
