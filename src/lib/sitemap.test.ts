import { describe, expect, test } from "bun:test";
import { buildSitemapXml, publicSitemapEntries } from "./sitemap";

describe("sitemap generation", () => {
  test("includes only indexable public routes", () => {
    const xml = buildSitemapXml(publicSitemapEntries, { siteUrl: "https://korasutra.com" });

    expect(xml).toContain("<loc>https://korasutra.com/</loc>");
    expect(xml).toContain("<loc>https://korasutra.com/collections/all</loc>");
    expect(xml).toContain("<loc>https://korasutra.com/journals</loc>");
    expect(xml.includes("/admin")).toBe(false);
    expect(xml.includes("/checkout")).toBe(false);
    expect(xml.includes("/cart")).toBe(false);
  });

  test("keeps sitemap URLs lowercase and canonical", () => {
    const xml = buildSitemapXml([{ path: "/Collections/Tussar/", priority: 0.8 }], { siteUrl: "https://korasutra.com/" });

    expect(xml).toContain("<loc>https://korasutra.com/collections/tussar</loc>");
  });
});
