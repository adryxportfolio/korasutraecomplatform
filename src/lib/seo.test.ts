import { describe, expect, test } from "bun:test";
import {
  SEO_CONFIG,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  generatePageMetadata,
  routeRobotsDirective,
} from "./seo";

describe("SEO helpers", () => {
  test("uses Korasutra as the metadata brand spelling", () => {
    expect(SEO_CONFIG.siteName).toBe("Korasutra");

    const metadata = generatePageMetadata({
      title: "Handcrafted Sarees",
      description: "Shop authentic handcrafted sarees.",
      path: "/",
    });

    expect(metadata.title).toBe("Handcrafted Sarees | Korasutra");
    expect(metadata.title.includes("Kora Sutra")).toBe(false);
  });

  test("canonicalizes URLs by removing query strings, uppercase, and trailing slashes", () => {
    const metadata = generatePageMetadata({
      title: "Tussar Sarees",
      description: "Handcrafted Tussar sarees.",
      path: "/Collections/Tussar/?sort=price-high&utm_source=google",
    });

    expect(metadata.canonical).toBe("https://korasutra.com/collections/tussar");
  });

  test("marks private and thin utility routes noindex", () => {
    expect(routeRobotsDirective("/admin")).toBe("noindex, nofollow");
    expect(routeRobotsDirective("/checkout")).toBe("noindex, nofollow");
    expect(routeRobotsDirective("/cart")).toBe("noindex, nofollow");
    expect(routeRobotsDirective("/collections/all")).toBe("index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  });

  test("builds valid brand and breadcrumb JSON-LD without fake reviews", () => {
    const organization = buildOrganizationJsonLd();
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Sarees", path: "/collections/all" },
    ]);

    expect(organization.name).toBe("Korasutra");
    expect(organization.alternateName).toContain("Kora Sutra");
    expect("aggregateRating" in organization).toBe(false);
    expect(breadcrumb.itemListElement[1].item).toBe("https://korasutra.com/collections/all");
  });
});
