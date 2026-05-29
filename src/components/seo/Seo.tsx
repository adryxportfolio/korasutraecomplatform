import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import {
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildProductJsonLd,
  generatePageMetadata,
  SEO_CONFIG,
  type PageMetadata,
  type PageMetadataInput,
} from "@/lib/seo";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

export function SeoHead({ metadata, children }: { metadata: PageMetadata | PageMetadataInput; children?: ReactNode }) {
  const resolved = "canonical" in metadata ? metadata : generatePageMetadata(metadata);

  return (
    <Helmet>
      <title>{resolved.title}</title>
      <meta name="title" content={resolved.title} />
      <meta name="description" content={resolved.description} />
      <meta name="robots" content={resolved.robots} />
      <meta name="googlebot" content={resolved.robots} />
      <link rel="canonical" href={resolved.canonical} />

      <meta property="og:type" content={resolved.type} />
      <meta property="og:url" content={resolved.canonical} />
      <meta property="og:title" content={resolved.title} />
      <meta property="og:description" content={resolved.description} />
      <meta property="og:image" content={resolved.image} />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      <meta property="og:locale" content={SEO_CONFIG.locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolved.canonical} />
      <meta name="twitter:title" content={resolved.title} />
      <meta name="twitter:description" content={resolved.description} />
      <meta name="twitter:image" content={resolved.image} />
      <meta name="twitter:site" content={SEO_CONFIG.twitterHandle} />
      {children}
    </Helmet>
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  return <JsonLd data={buildBreadcrumbJsonLd(items)} />;
}

export function ProductJsonLd(props: Parameters<typeof buildProductJsonLd>[0]) {
  return <JsonLd data={buildProductJsonLd(props)} />;
}

export function LocalBusinessJsonLd() {
  return <JsonLd data={buildLocalBusinessJsonLd()} />;
}
