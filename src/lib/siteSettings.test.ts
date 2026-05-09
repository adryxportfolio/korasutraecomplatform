import { beforeEach, describe, expect, test } from "bun:test";
import {
  SITE_SETTINGS_CHANGED_EVENT,
  SITE_SETTINGS_STORAGE_KEY,
  cacheSiteSettings,
  defaultSiteSettings,
  normalizeSiteSettings,
  readCachedSiteSettings,
} from "./siteSettings";

describe("site settings", () => {
  const dispatchedEvents: Event[] = [];

  beforeEach(() => {
    const store = new Map<string, string>();
    dispatchedEvents.length = 0;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => store.set(key, value),
        },
        dispatchEvent: (event: Event) => {
          dispatchedEvents.push(event);
          return true;
        },
      },
    });
  });

  test("keeps promotional popups disabled by default", () => {
    expect(defaultSiteSettings.promoPopup.enabled).toBe(false);
    expect(defaultSiteSettings.promoPopup.discountLabel).toBe("");
  });

  test("normalizes partial rows without reviving the old first buyer popup", () => {
    expect(normalizeSiteSettings(null).promoPopup.enabled).toBe(false);
    expect(normalizeSiteSettings({ promo_popup: { title: "Sale" } }).promoPopup).toEqual({
      ...defaultSiteSettings.promoPopup,
      title: "Sale",
    });
  });

  test("normalizes cached camel-case popup settings", () => {
    expect(normalizeSiteSettings({ promoPopup: { enabled: true, title: "Preview" } }).promoPopup).toEqual({
      ...defaultSiteSettings.promoPopup,
      enabled: true,
      title: "Preview",
    });
  });

  test("caches settings and emits a same-tab sync event", () => {
    const settings = normalizeSiteSettings({
      hero: { ctaText: "Shop silk" },
      promo_popup: { enabled: true, code: "LIVE15" },
    });

    cacheSiteSettings(settings);

    expect(window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)).toContain("LIVE15");
    expect(readCachedSiteSettings()).toEqual(settings);
    expect(dispatchedEvents.at(-1)?.type).toBe(SITE_SETTINGS_CHANGED_EVENT);
  });
});
