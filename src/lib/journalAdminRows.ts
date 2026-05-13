import { journalArticles as fallbackJournalArticles, type JournalArticle } from "@/data/journals";

type RemoteJournalRow = Record<string, unknown> & { slug?: string };

function fallbackToEditableRow(article: JournalArticle) {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    image_url: article.image,
    category: article.category,
    author: article.author,
    read_time: article.readTime,
    keywords: article.keywords,
    status: "published",
    published_at: article.date,
  };
}

export function buildEditableJournalRows(remoteRows: RemoteJournalRow[] = [], fallbackRows: JournalArticle[] = fallbackJournalArticles) {
  const rowsBySlug = new Map<string, RemoteJournalRow | ReturnType<typeof fallbackToEditableRow>>();

  fallbackRows.forEach((article) => {
    rowsBySlug.set(article.slug, fallbackToEditableRow(article));
  });

  remoteRows.forEach((row) => {
    if (row?.slug) rowsBySlug.set(row.slug, row);
  });

  return Array.from(rowsBySlug.values());
}
