import { describe, expect, test } from "bun:test";
import { defaultSiteSettings, normalizeSiteSettings } from "./siteSettings";

describe("site settings", () => {
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
});
