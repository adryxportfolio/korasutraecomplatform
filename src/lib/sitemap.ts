import { canonicalPath, SEO_CONFIG } from "./seo";

export type SitemapEntry = {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  image?: {
    loc: string;
    title?: string;
  };
};

const lastmod = "2026-05-29";

export const publicSitemapEntries: SitemapEntry[] = [
  { path: "/", lastmod, changefreq: "daily", priority: 1, image: { loc: "/og-image.png", title: "Korasutra handcrafted sarees" } },
  { path: "/collections/all", lastmod, changefreq: "daily", priority: 0.9 },
  { path: "/collections/tussar", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/matka", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/muslin", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/pure-silk", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/katan-silk", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/linen", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/cotton", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/jamdani", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/kantha-stitch", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/baluchari", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/hand-paint", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/block-print", lastmod, changefreq: "weekly", priority: 0.8 },
  { path: "/collections/batik", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/digital-print", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/paithani", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/traditional", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/casual", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/office-wear", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/collections/party-wear", lastmod, changefreq: "weekly", priority: 0.75 },
  { path: "/about", lastmod, changefreq: "monthly", priority: 0.7 },
  { path: "/contact", lastmod, changefreq: "monthly", priority: 0.7 },
  { path: "/journals", lastmod, changefreq: "weekly", priority: 0.7 },
  { path: "/faqs", lastmod, changefreq: "monthly", priority: 0.6 },
  { path: "/shipping", lastmod, changefreq: "monthly", priority: 0.5 },
  { path: "/returns", lastmod, changefreq: "monthly", priority: 0.5 },
  { path: "/size-guide", lastmod, changefreq: "monthly", priority: 0.5 },
  { path: "/terms", lastmod, changefreq: "yearly", priority: 0.3 },
  { path: "/privacy", lastmod, changefreq: "yearly", priority: 0.3 },
  { path: "/cookies", lastmod, changefreq: "yearly", priority: 0.3 },
  { path: "/legal", lastmod, changefreq: "yearly", priority: 0.3 },
];

function xmlText(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absolute(pathOrUrl: string, siteUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl.replace(/\/+$/, "")}${canonicalPath(pathOrUrl)}`;
}

export function buildSitemapXml(entries: SitemapEntry[] = publicSitemapEntries, options: { siteUrl?: string } = {}) {
  const siteUrl = (options.siteUrl || SEO_CONFIG.siteUrl).replace(/\/+$/, "");
  const urls = entries.map((entry) => {
    const loc = absolute(entry.path, siteUrl);
    return [
      "  <url>",
      `    <loc>${xmlText(loc)}</loc>`,
      entry.lastmod ? `    <lastmod>${xmlText(entry.lastmod)}</lastmod>` : "",
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
      typeof entry.priority === "number" ? `    <priority>${entry.priority.toFixed(1)}</priority>` : "",
      entry.image ? [
        "    <image:image>",
        `      <image:loc>${xmlText(absolute(entry.image.loc, siteUrl))}</image:loc>`,
        entry.image.title ? `      <image:title>${xmlText(entry.image.title)}</image:title>` : "",
        "    </image:image>",
      ].filter(Boolean).join("\n") : "",
      "  </url>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    urls,
    "</urlset>",
  ].join("\n");
}
