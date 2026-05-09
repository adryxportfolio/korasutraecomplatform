export type SiteHeroSettings = {
  desktopImageUrl: string;
  mobileImageUrl: string;
  altText: string;
  ctaText: string;
  ctaHref: string;
};

export type SiteNavLink = {
  label: string;
  href: string;
  enabled: boolean;
};

export type SiteNavbarSettings = {
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref: string;
  navLinks: SiteNavLink[];
};

export type SitePromoPopupSettings = {
  enabled: boolean;
  title: string;
  body: string;
  discountLabel: string;
  code: string;
  ctaText: string;
  ctaHref: string;
  finePrint: string;
  delayMs: number;
};

export type SiteSettings = {
  hero: SiteHeroSettings;
  navbar: SiteNavbarSettings;
  promoPopup: SitePromoPopupSettings;
};

export type SiteSettingsRow = {
  hero?: Partial<SiteHeroSettings> | null;
  navbar?: Partial<SiteNavbarSettings> | null;
  promo_popup?: Partial<SitePromoPopupSettings> | null;
};

export const defaultSiteSettings: SiteSettings = {
  hero: {
    desktopImageUrl: "",
    mobileImageUrl: "",
    altText: "Kora Sutra Sarees - Explore Our Collection of Handcrafted Tussar, Muslin & Silk Sarees",
    ctaText: "Explore Our Collection",
    ctaHref: "/collections/all",
  },
  navbar: {
    announcementEnabled: true,
    announcementText: "FREE Shipping All Over India",
    announcementHref: "/collections/all",
    navLinks: [
      { label: "Home", href: "/", enabled: true },
      { label: "Products", href: "/collections/all", enabled: true },
    ],
  },
  promoPopup: {
    enabled: false,
    title: "",
    body: "",
    discountLabel: "",
    code: "",
    ctaText: "Shop Now",
    ctaHref: "/collections/all",
    finePrint: "",
    delayMs: 1500,
  },
};

function cleanNavLinks(value: unknown): SiteNavLink[] {
  if (!Array.isArray(value)) return defaultSiteSettings.navbar.navLinks;
  const links = value
    .map((link) => ({
      label: String(link?.label || "").trim(),
      href: String(link?.href || "").trim(),
      enabled: link?.enabled !== false,
    }))
    .filter((link) => link.label && link.href);
  return links.length ? links : defaultSiteSettings.navbar.navLinks;
}

export function normalizeSiteSettings(row: SiteSettingsRow | null | undefined): SiteSettings {
  const hero = row?.hero || {};
  const navbar = row?.navbar || {};
  const promoPopup = row?.promo_popup || {};

  return {
    hero: {
      ...defaultSiteSettings.hero,
      ...hero,
      ctaHref: String(hero.ctaHref || defaultSiteSettings.hero.ctaHref),
    },
    navbar: {
      ...defaultSiteSettings.navbar,
      ...navbar,
      navLinks: cleanNavLinks(navbar.navLinks),
    },
    promoPopup: {
      ...defaultSiteSettings.promoPopup,
      ...promoPopup,
      enabled: Boolean(promoPopup.enabled),
      delayMs: Math.max(0, Number(promoPopup.delayMs ?? defaultSiteSettings.promoPopup.delayMs)),
    },
  };
}

export function siteSettingsToRow(settings: SiteSettings) {
  return {
    hero: settings.hero,
    navbar: settings.navbar,
    promo_popup: settings.promoPopup,
  };
}
