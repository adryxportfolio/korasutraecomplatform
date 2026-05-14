import { textMatchesCatalogQuery } from "@/lib/catalogTaxonomy";

export type CollectionProductSearchFields = {
  title?: string;
  description?: string;
  tags?: string[];
  fabric?: string | null;
  technique?: string | null;
  color?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
};

export function productMatchesCollectionQuery(product: CollectionProductSearchFields, query: string) {
  const text = [
    product.title,
    product.description,
    product.fabric,
    product.technique,
    product.color,
    product.category?.slug,
    product.category?.name,
  ].filter(Boolean).join(" ");

  return textMatchesCatalogQuery(text, product.tags || [], query);
}
