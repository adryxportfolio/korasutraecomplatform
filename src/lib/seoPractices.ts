export type SeoPractice = {
  area: string;
  status: "Live" | "Protected" | "Ready" | "Manual";
  summary: string;
  why: string;
  evidence: string;
};

export const seoPractices: SeoPractice[] = [
  {
    area: "Canonical URLs",
    status: "Live",
    summary: "Every public route emits a clean lowercase canonical URL without filter or tracking query strings.",
    why: "Prevents duplicate URL variants from competing in Google Search Console.",
    evidence: "RouteSeoPolicy, page Helmet tags, and canonicalPath()",
  },
  {
    area: "Search Console Canonical Fix",
    status: "Live",
    summary: "Removed the hardcoded home canonical from the SPA shell and moved canonical control to route-level metadata.",
    why: "Stops product and collection pages from initially claiming the homepage canonical.",
    evidence: "index.html no longer ships a static canonical link",
  },
  {
    area: "Robots / Noindex",
    status: "Protected",
    summary: "Admin, checkout, cart, wishlist, order tracking, thank-you, API and account-style pages are excluded.",
    why: "Keeps private, thin, and transactional pages out of the index.",
    evidence: "robots.txt, X-Robots-Tag headers, and React Helmet noindex",
  },
  {
    area: "301 Redirects",
    status: "Live",
    summary: "Legacy and irrelevant crawl paths redirect to the most useful canonical destinations.",
    why: "Consolidates link equity and gives Google stable long-term URLs.",
    evidence: "vercel.json redirects",
  },
  {
    area: "Structured Data",
    status: "Live",
    summary: "Organization, Website, LocalBusiness, BreadcrumbList, Product, BlogPosting, CollectionPage and FAQ schema are present where relevant.",
    why: "Gives Google explicit page meaning without fake reviews or unsupported claims.",
    evidence: "JSON-LD helpers and page-level schema",
  },
  {
    area: "Metadata Brand Spelling",
    status: "Live",
    summary: "SEO titles use Korasutra, while Kora Sutra remains an alternate name for misspelling correction.",
    why: "Helps Google associate spaced searches with the canonical brand spelling.",
    evidence: "SEO_CONFIG.siteName and updated title tags",
  },
  {
    area: "Sitemap",
    status: "Ready",
    summary: "Sitemap contains indexable public routes only, with private and query-driven URLs removed.",
    why: "Search engines get the URLs we actually want crawled.",
    evidence: "public/sitemap.xml and sitemap builder tests",
  },
  {
    area: "Meta Commerce Feed",
    status: "Ready",
    summary: "Admin CSV and XML exports now match Meta catalog fields, with a public scheduled feed function available.",
    why: "Keeps product discovery and dynamic ads aligned with the live catalog.",
    evidence: "buildMetaCatalogCsv(), buildMetaCatalogXml(), meta-catalog-feed",
  },
  {
    area: "Open Graph / Twitter",
    status: "Live",
    summary: "Public pages include share titles, descriptions, canonical URLs and image previews.",
    why: "Improves link previews and reduces inconsistent social metadata.",
    evidence: "SeoHead and page Helmet tags",
  },
  {
    area: "Manual Verification",
    status: "Manual",
    summary: "Google Search Console verification token and final Rich Results validation still need live-site confirmation.",
    why: "Verification codes and Google recrawl actions must be completed in your Google/Meta accounts.",
    evidence: "Admin checklist and deployment checklist",
  },
];

export const seoAuditEvents = [
  "Detected Vite + React Router SPA; implemented SEO with React Helmet and deploy headers instead of Next.js App Router files.",
  "Canonical logic now strips query strings, lowercases paths, and removes trailing slashes.",
  "Filtered collection/search URLs are noindex, follow with canonical collection URLs.",
  "Product not found state is noindex and points users back to the catalog.",
  "Meta catalog CSV header matches the uploaded Commerce Manager template.",
  "AI Sensy commerce templates are configured through environment variables, not hardcoded secrets.",
];
