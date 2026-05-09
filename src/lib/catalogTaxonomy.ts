export type CatalogTaxonomyGroup = "fabric" | "pattern" | "occasion";

export type CatalogTaxonomyOption = {
  slug: string;
  label: string;
  group: CatalogTaxonomyGroup;
};

export const catalogTaxonomy: Record<CatalogTaxonomyGroup, CatalogTaxonomyOption[]> = {
  fabric: [
    { slug: "tussar", label: "Tussar", group: "fabric" },
    { slug: "matka", label: "Matka", group: "fabric" },
    { slug: "muslin", label: "Muslin", group: "fabric" },
    { slug: "silk", label: "Silk", group: "fabric" },
    { slug: "katan-silk", label: "Katan Silk", group: "fabric" },
    { slug: "linen", label: "Linen", group: "fabric" },
    { slug: "cotton", label: "Cotton", group: "fabric" },
  ],
  pattern: [
    { slug: "jamdani", label: "Jamdani", group: "pattern" },
    { slug: "kantha-stitch", label: "Kantha Stitch", group: "pattern" },
    { slug: "baluchari", label: "Baluchari", group: "pattern" },
    { slug: "hand-paint", label: "Hand Paint", group: "pattern" },
    { slug: "block-print", label: "Block Print", group: "pattern" },
    { slug: "batik", label: "Batik", group: "pattern" },
    { slug: "digital-print", label: "Digital Print", group: "pattern" },
    { slug: "paithani", label: "Paithani", group: "pattern" },
  ],
  occasion: [
    { slug: "traditional", label: "Mummy ki Almari (Traditional)", group: "occasion" },
    { slug: "casual", label: "Bas Yun Hi (Casual)", group: "occasion" },
    { slug: "office-wear", label: "Desk Se Dil Tak (Office Wear)", group: "occasion" },
    { slug: "party-wear", label: "Aj Main Upar (Party Wear)", group: "occasion" },
  ],
};

export const allCatalogTaxonomyOptions = Object.values(catalogTaxonomy).flat();

export function tagsForCatalogSelection(selection: Record<CatalogTaxonomyGroup, string[]>) {
  return Object.entries(selection).flatMap(([group, slugs]) => slugs.map((slug) => `${group}:${slug}`));
}

export function selectionFromTags(tags: string[] = []): Record<CatalogTaxonomyGroup, string[]> {
  return {
    fabric: tags.filter((tag) => tag.startsWith("fabric:")).map((tag) => tag.replace("fabric:", "")),
    pattern: tags.filter((tag) => tag.startsWith("pattern:")).map((tag) => tag.replace("pattern:", "")),
    occasion: tags.filter((tag) => tag.startsWith("occasion:")).map((tag) => tag.replace("occasion:", "")),
  };
}

export function catalogSearchTerms(query: string) {
  const normalized = query.toLowerCase().trim();
  const direct = [normalized];
  const matchingOptions = allCatalogTaxonomyOptions.filter((option) => (
    option.slug === normalized ||
    option.label.toLowerCase() === normalized ||
    option.label.toLowerCase().includes(normalized)
  ));

  return [
    ...direct,
    ...matchingOptions.flatMap((option) => [option.slug, option.label.toLowerCase(), `${option.group}:${option.slug}`]),
  ].filter(Boolean);
}

export function textMatchesCatalogQuery(text: string, tags: string[] | undefined, query: string) {
  const haystack = `${text} ${(tags || []).join(" ")}`.toLowerCase();
  return catalogSearchTerms(query).some((term) => haystack.includes(term));
}
