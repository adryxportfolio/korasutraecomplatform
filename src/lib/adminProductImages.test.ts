import { describe, expect, test } from "bun:test";
import {
  buildAdminProductImages,
  findInvalidMediaUrls,
  findShopifyCdnMediaUrls,
  moveAdminProductImage,
  removeAdminProductImage,
} from "./adminProductImages";

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

  test("keeps the explicit admin gallery order when stored and uploaded images are mixed", () => {
    expect(buildAdminProductImages({
      title: "Ordered Blouse",
      orderedImages: [
        { url: "https://cdn.example.com/uploaded-detail.jpg" },
        { url: "https://cdn.example.com/stored-front.jpg" },
        { url: "https://cdn.example.com/uploaded-back.jpg", altText: "Back view" },
      ],
      imageUrls: "https://cdn.example.com/stored-front.jpg",
      uploadedImages: [
        { url: "https://cdn.example.com/uploaded-detail.jpg" },
        { url: "https://cdn.example.com/uploaded-back.jpg", altText: "Back view" },
      ],
    })).toEqual([
      { url: "https://cdn.example.com/uploaded-detail.jpg", altText: "Ordered Blouse" },
      { url: "https://cdn.example.com/stored-front.jpg", altText: "Ordered Blouse" },
      { url: "https://cdn.example.com/uploaded-back.jpg", altText: "Back view" },
    ]);
  });

  test("moves a product image to a new position", () => {
    expect(moveAdminProductImage(["front", "detail", "back"], 2, 0)).toEqual([
      "back",
      "front",
      "detail",
    ]);
  });

  test("removes a product image from the editable gallery", () => {
    expect(removeAdminProductImage(["front", "detail", "back"], 1)).toEqual([
      "front",
      "back",
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

  test("flags media that is not a valid http(s) URL", () => {
    expect(findInvalidMediaUrls({
      images: [
        { url: "https://abc.supabase.co/storage/v1/object/public/product-images/front.jpg" },
        { url: "data:image/png;base64,iVBORw0KGgo=" },
      ],
      videos: [
        { url: "https://abc.supabase.co/storage/v1/object/public/product-videos/drape.mp4" },
        { url: "not-a-url" },
      ],
    })).toEqual([
      "data:image/png;base64,iVBORw0KGgo=",
      "not-a-url",
    ]);
  });
});
