import { describe, expect, test } from "bun:test";
import { buildMetaCatalogCsv, buildMetaCatalogXml, buildProductExportCsv } from "./productFeeds";

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
  test("builds a Meta catalog CSV with the uploaded Commerce Manager column format", () => {
    const csv = buildProductExportCsv(productRows);

    expect(csv.split("\n")[0]).toBe(
      "id,title,description,availability,condition,price,link,image_link,brand,google_product_category,fb_product_category,quantity_to_sell_on_facebook,sale_price,sale_price_effective_date,item_group_id,gender,color,size,age_group,material,pattern,shipping,shipping_weight,offer_disclaimer,offer_disclaimer_url,video[0].url,video[0].tag[0],gtin,product_tags[0],product_tags[1],style[0]",
    );
    expect(csv).toContain('"Red ""Festive"" Saree"');
    expect(csv).toContain("in stock,new,2499.00 INR,https://korasutra.com/products/red-festive-saree");
    expect(csv).toContain("1999.00 INR,,product-1,unisex,Red,,adult,Muslin");
    expect(csv).toContain("Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris");
    expect(buildMetaCatalogCsv(productRows)).toBe(csv);
  });

  test("builds a Meta catalog XML feed with Google Merchant compatible g fields", () => {
    const xml = buildMetaCatalogXml(productRows, { siteUrl: "https://korasutra.com" });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<g:id>KS-RED</g:id>");
    expect(xml).toContain("<g:title>Red &quot;Festive&quot; Saree</g:title>");
    expect(xml).toContain("<g:availability>in stock</g:availability>");
    expect(xml).toContain("<g:price>2499.00 INR</g:price>");
    expect(xml).toContain("<g:sale_price>1999.00 INR</g:sale_price>");
    expect(xml).toContain("<g:link>https://korasutra.com/products/red-festive-saree</g:link>");
  });
});
