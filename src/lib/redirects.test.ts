import { describe, expect, test } from "bun:test";
import { getCanonicalRedirect, vercelRedirects } from "./redirects";

describe("redirect helpers", () => {
  test("normalizes uppercase and trailing slash URLs to canonical lowercase paths", () => {
    expect(getCanonicalRedirect("/Collections/Tussar/")).toEqual({
      source: "/Collections/Tussar/",
      destination: "/collections/tussar",
      permanent: true,
    });
  });

  test("redirects legacy and irrelevant crawl paths to useful public pages", () => {
    expect(vercelRedirects.some((rule) => rule.source === "/collection/:slug" && rule.destination === "/collections/:slug")).toBe(true);
    expect(vercelRedirects.some((rule) => rule.source === "/products" && rule.destination === "/collections/all")).toBe(true);
    expect(vercelRedirects.some((rule) => rule.source === "/kora-sutra" && rule.destination === "/")).toBe(true);
  });
});
