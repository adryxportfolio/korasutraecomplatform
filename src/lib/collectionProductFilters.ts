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

const blouseCategoryTerms = new Set(["blouse", "blouses"]);

function normalizeCollectionTerm(value?: string | null) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "-");
}

export function productIsBlouseCategory(product: CollectionProductSearchFields) {
  return [
    product.category?.slug,
    product.category?.name,
  ].some((value) => blouseCategoryTerms.has(normalizeCollectionTerm(value)));
}

function isBlouseCollectionTerm(query: string) {
  return blouseCategoryTerms.has(normalizeCollectionTerm(query));
}

export function productMatchesCollectionScope(product: CollectionProductSearchFields, slug?: string | null) {
  const collectionSlug = normalizeCollectionTerm(slug);
  if (!collectionSlug) return true;
  if (blouseCategoryTerms.has(collectionSlug)) return productIsBlouseCategory(product);
  return !productIsBlouseCategory(product);
}

export function productHasSareeBlousePiece(product: CollectionProductSearchFields) {
  if (productIsBlouseCategory(product)) return false;

  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const tags = product.tags?.map((tag) => tag.toLowerCase()) || [];
  const withBlouseIndicators = ["with blouse", "blouse included", "includes blouse", "blouse piece included", "running blouse"];
  const withoutBlouseIndicators = ["without blouse", "no blouse", "blouse not included", "saree only"];

  for (const tag of tags) {
    if (withBlouseIndicators.some((indicator) => tag.includes(indicator))) return true;
    if (withoutBlouseIndicators.some((indicator) => tag.includes(indicator))) return false;
  }

  if (withBlouseIndicators.some((indicator) => text.includes(indicator))) return true;
  if (withoutBlouseIndicators.some((indicator) => text.includes(indicator))) return false;
  if (text.includes("blouse") && !text.includes("without blouse")) return true;

  return false;
}

export function productMatchesCollectionQuery(product: CollectionProductSearchFields, query: string) {
  if (isBlouseCollectionTerm(query)) return productIsBlouseCategory(product);
  if (productIsBlouseCategory(product)) return false;

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
