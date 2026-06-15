type CsvRow = Record<string, string>;

export type AdminImportProduct = {
  handle: string;
  title: string;
  description: string;
  shortDescription: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  fabric: string;
  technique: string;
  color: string;
  status: "active" | "draft" | "archived";
  hasBlousePiece: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  images: Array<{ url: string; altText: string }>;
  variants: Array<{
    sku: string;
    title: string;
    option1Name: string | null;
    option1Value: string | null;
    option2Name: string | null;
    option2Value: string | null;
    option3Name?: string | null;
    option3Value?: string | null;
    option4Name?: string | null;
    option4Value?: string | null;
    price: number;
    compareAtPrice: number | null;
    inventoryQty: number;
    trackInventory: boolean;
    position: number;
  }>;
};

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function parseCsv(text: string): CsvRow[] {
  const rows = parseCsvRows(text);
  const headers = rows[0] || [];
  return rows.slice(1).map((row) => {
    const entry: CsvRow = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] || "";
    });
    return entry;
  });
}

function money(value: string): number {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalMoney(value: string): number | null {
  const parsed = money(value);
  return parsed > 0 ? parsed : null;
}

function cleanTitle(title: string) {
  return title.replace(/\s*\|\s*Korasutra\s*$/i, "").trim();
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function splitTags(tags: string) {
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function includesBlouse(text: string) {
  const lower = text.toLowerCase();
  return lower.includes("with blouse") || lower.includes("blouse piece") || lower.includes("running blouse");
}

function normalizeStatus(status: string): "active" | "draft" | "archived" {
  const lower = status.toLowerCase();
  if (lower === "active") return "active";
  if (lower === "archived") return "archived";
  return "active";
}

function variantTitle(row: CsvRow) {
  const values = [row["Option1 Value"], row["Option2 Value"], row["Option3 Value"]].filter((value) => value && value !== "Default Title");
  return values.length ? values.join(" / ") : "Default";
}

export function parseShopifyProductsCsv(text: string): AdminImportProduct[] {
  const rows = parseCsv(text);
  const groups = new Map<string, CsvRow[]>();

  rows.forEach((row) => {
    const handle = row.Handle?.trim();
    if (!handle) return;
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle)?.push(row);
  });

  return Array.from(groups.entries()).map(([handle, group]) => {
    const base = group.find((row) => row.Title?.trim()) || group[0];
    const bodyText = stripHtml(base["Body (HTML)"] || "");
    const tags = splitTags(base.Tags || "");
    const price = money(base["Variant Price"]);
    const productText = `${base.Title} ${base["Body (HTML)"]} ${base.Tags}`;
    const variantRows = group.filter((row) => row["Variant Price"] || row["Variant SKU"] || row["Option1 Value"]);
    const images = group
      .filter((row) => row["Image Src"])
      .sort((a, b) => Number(a["Image Position"] || 0) - Number(b["Image Position"] || 0))
      .slice(0, 5)
      .map((row) => ({
        url: row["Image Src"],
        altText: row["Image Alt Text"] || cleanTitle(base.Title || handle),
      }));

    return {
      handle,
      title: cleanTitle(base.Title || handle),
      description: base["Body (HTML)"] || bodyText,
      shortDescription: bodyText.slice(0, 180),
      categorySlug: /blouse/i.test(`${base.Title} ${base["Product Category"]}`) && !/saree/i.test(base.Title) ? "blouses" : "sarees",
      price,
      compareAtPrice: optionalMoney(base["Variant Compare At Price"]),
      fabric: base["Fabric (product.metafields.shopify.fabric)"] || "",
      technique: base.Type || "",
      color: base["Color (product.metafields.shopify.color-pattern)"] || "",
      status: normalizeStatus(base.Status || (base.Published === "true" ? "active" : "draft")),
      hasBlousePiece: includesBlouse(productText),
      seoTitle: base["SEO Title"] || "",
      seoDescription: base["SEO Description"] || "",
      tags,
      images,
      variants: (variantRows.length ? variantRows : [base]).map((row, index) => ({
        sku: row["Variant SKU"] || `KS-${handle}-${index + 1}`,
        title: variantTitle(row),
        option1Name: row["Option1 Name"] && row["Option1 Name"] !== "Title" ? row["Option1 Name"] : null,
        option1Value: row["Option1 Value"] && row["Option1 Value"] !== "Default Title" ? row["Option1 Value"] : null,
        option2Name: row["Option2 Name"] || null,
        option2Value: row["Option2 Value"] || null,
        price: money(row["Variant Price"]) || price,
        compareAtPrice: optionalMoney(row["Variant Compare At Price"]),
        inventoryQty: Number(row["Variant Inventory Qty"] || 0),
        trackInventory: row["Variant Inventory Tracker"] !== "",
        position: index,
      })),
    };
  }).filter((product) => product.title && product.price > 0 && product.handle !== "cod-fee" && product.technique.toLowerCase() !== "fee");
}
