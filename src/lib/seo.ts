export type RobotsDirective = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" | "noindex, nofollow";

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
};

export type PageMetadata = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: "website" | "article" | "product";
  robots: RobotsDirective;
};

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

function normalizeSiteUrl(value: string | undefined) {
  return (value || "https://korasutra.com").replace(/\/+$/, "");
}

function absoluteUrl(pathOrUrl: string, siteUrl = SEO_CONFIG.siteUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${path}`;
}

export function canonicalPath(path: string) {
  const withoutQuery = path.split(/[?#]/)[0] || "/";
  const normalized = withoutQuery
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "")
    .toLowerCase();
  return normalized || "/";
}

export const SEO_CONFIG = {
  siteUrl: normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL || env.VITE_PUBLIC_SITE_URL || env.VITE_APP_URL),
  siteName: env.NEXT_PUBLIC_SITE_NAME || env.VITE_PUBLIC_SITE_NAME || "Korasutra",
  defaultOgImage: absoluteUrl(env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || env.VITE_PUBLIC_DEFAULT_OG_IMAGE || "/og-image.png", normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL || env.VITE_PUBLIC_SITE_URL || env.VITE_APP_URL)),
  defaultDescription:
    "Shop authentic handcrafted sarees at Korasutra. Discover Tussar silk, Muslin, Linen, Jamdani, Kantha stitch and block print sarees with India-wide delivery.",
  locale: "en_IN",
  twitterHandle: "@korasutra",
  supportEmail: "customer.support@korasutra.com",
  supportPhone: "+91-79958-62266",
  socialLinks: [
    "https://www.instagram.com/korasutraofficial/",
    "https://www.facebook.com/people/Korasutraofficial/61585129572992",
  ],
  businessAddress: {
    locality: "Hyderabad",
    region: "Telangana",
    postalCode: "500001",
    country: "IN",
  },
} as const;

const INDEX_ROBOTS: RobotsDirective = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NOINDEX_ROBOTS: RobotsDirective = "noindex, nofollow";

const privateRoutePrefixes = [
  "/admin",
  "/dashboard",
  "/account",
  "/checkout",
  "/cart",
  "/api",
  "/login",
  "/wishlist",
  "/thank-you",
  "/order-tracking",
  "/cart/add",
];

export function routeRobotsDirective(path: string): RobotsDirective {
  const cleanPath = canonicalPath(path);
  return privateRoutePrefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))
    ? NOINDEX_ROBOTS
    : INDEX_ROBOTS;
}

function titleWithBrand(title: string) {
  const trimmed = title.trim();
  return trimmed.includes(SEO_CONFIG.siteName) ? trimmed : `${trimmed} | ${SEO_CONFIG.siteName}`;
}

function clampDescription(description: string) {
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}...` : clean;
}

export function generatePageMetadata(input: PageMetadataInput): PageMetadata {
  const canonical = absoluteUrl(canonicalPath(input.path));
  return {
    title: titleWithBrand(input.title),
    description: clampDescription(input.description || SEO_CONFIG.defaultDescription),
    canonical,
    image: absoluteUrl(input.image || SEO_CONFIG.defaultOgImage),
    type: input.type || "website",
    robots: input.noindex ? NOINDEX_ROBOTS : routeRobotsDirective(input.path),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.siteName,
    alternateName: ["Kora Sutra", "KoraSutra", "Kora Sutra Sarees"],
    url: SEO_CONFIG.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${SEO_CONFIG.siteUrl}/favicon.png`,
      width: 512,
      height: 512,
    },
    image: SEO_CONFIG.defaultOgImage,
    description: SEO_CONFIG.defaultDescription,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SEO_CONFIG.supportPhone,
        contactType: "customer service",
        email: SEO_CONFIG.supportEmail,
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
    ],
    sameAs: [...SEO_CONFIG.socialLinks],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_CONFIG.siteUrl}/#website`,
    url: SEO_CONFIG.siteUrl,
    name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.defaultDescription,
    publisher: { "@id": `${SEO_CONFIG.siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SEO_CONFIG.siteUrl}/collections/all?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${SEO_CONFIG.siteUrl}/#localbusiness`,
    name: SEO_CONFIG.siteName,
    image: SEO_CONFIG.defaultOgImage,
    url: SEO_CONFIG.siteUrl,
    telephone: SEO_CONFIG.supportPhone,
    email: SEO_CONFIG.supportEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONFIG.businessAddress.locality,
      addressRegion: SEO_CONFIG.businessAddress.region,
      postalCode: SEO_CONFIG.businessAddress.postalCode,
      addressCountry: SEO_CONFIG.businessAddress.country,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "18:00",
      },
    ],
    priceRange: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI",
    currenciesAccepted: "INR",
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(canonicalPath(item.path)),
    })),
  };
}

export function buildProductJsonLd(input: {
  name: string;
  description: string;
  images: string[];
  path: string;
  sku?: string | null;
  price: string | number;
  currency?: string;
  inStock: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images,
    brand: { "@type": "Brand", name: SEO_CONFIG.siteName },
    sku: input.sku || undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(canonicalPath(input.path)),
      priceCurrency: input.currency || "INR",
      price: String(input.price),
      availability: input.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SEO_CONFIG.siteName },
    },
  };
}
