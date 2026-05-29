import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { META_PIXEL_IDS, trackMetaPageView } from "./metaPixel";

const indexHtml = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("Meta Pixel setup", () => {
  test("registers the approved AI Sensy and Korasutra pixel IDs", () => {
    expect(META_PIXEL_IDS).toEqual([
      "1309757671041283",
      "1850165549038032",
      "1933328504239270",
    ]);
  });

  test("loads the Meta Pixel library once and initializes all approved pixels", () => {
    const facebookScriptMatches = indexHtml.match(/connect\.facebook\.net\/en_US\/fbevents\.js/g) ?? [];

    expect(facebookScriptMatches).toHaveLength(1);

    for (const pixelId of META_PIXEL_IDS) {
      expect(indexHtml).toContain(`fbq('init', '${pixelId}')`);
      expect(indexHtml).toContain(`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`);
    }
  });

  test("keeps JavaScript PageView tracking in the SPA route tracker", () => {
    const inlinePageViewMatches = indexHtml.match(/fbq\('track',\s*["']PageView["']\)/g) ?? [];

    expect(inlinePageViewMatches).toHaveLength(0);
  });

  test("tracks a PageView when fbq is available", () => {
    const calls: unknown[][] = [];

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        fbq: (...args: unknown[]) => {
          calls.push(args);
        },
      },
    });

    try {
      trackMetaPageView();

      expect(calls).toEqual([["track", "PageView"]]);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
