import { describe, expect, test } from "bun:test";
import { buildProductExportCsv, buildProductFeedXml } from "./productFeeds";

const productRows = [
  {
    id: "product-1",
    handle: "red-festive-saree",
    title: 'Red "Festive" Saree',
    category: { name: "Sarees", slug: "sarees" },
    status: "active",
    price: 1999,
    compare_at_price: 2499,
    fabric: "Muslin",
    technique: "Block, Print",
    color: "Red",
    has_blouse_piece: true,
    product_images: [
      { url: "https://res.cloudinary.com/demo/image/upload/red-front.jpg", position: 0 },
      { url: "https://res.cloudinary.com/demo/image/upload/red-back.jpg", position: 1 },
    ],
    product_variants: [
      { sku: "KS-RED", inventory_qty: 2, position: 0 },
      { sku: "KS-RED-B", inventory_qty: 3, position: 1 },
    ],
  },
  {
    id: "product-2",
    handle: "blue-saree",
    title: "Blue & Gold Saree",
    category: { name: "Sarees", slug: "sarees" },
    status: "draft",
    price: 1899,
    compare_at_price: null,
    has_blouse_piece: false,
    product_images: [],
    product_variants: [],
  },
];

describe("admin product exports", () => {
  test("builds a CSV product list with escaped fields and blouse status", () => {
    const csv = buildProductExportCsv(productRows);

    expect(csv.split("\n")[0]).toBe(
      "ID,Handle,Title,Category,Status,Price,Compare-at Price,Stock,Fabric,Technique,Color,Blouse Piece,Product URL,Image URLs,SKUs",
    );
    expect(csv).toContain('"Red ""Festive"" Saree"');
    expect(csv).toContain('"Block, Print"');
    expect(csv).toContain("Blouse Piece Included");
    expect(csv).toContain("KS-RED, KS-RED-B");
  });

  test("builds an XML feed link payload for all products", () => {
    const xml = buildProductFeedXml(productRows, { siteUrl: "https://korasutra.com" });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<products>");
    expect(xml).toContain("<title>Blue &amp; Gold Saree</title>");
    expect(xml).toContain("<blouse_piece>Blouse Piece Not Included</blouse_piece>");
    expect(xml).toContain("<url>https://korasutra.com/products/red-festive-saree</url>");
    expect(xml).toContain("<image>https://res.cloudinary.com/demo/image/upload/red-front.jpg</image>");
  });
});
