/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { journalArticles as fallbackJournalArticles, type JournalArticle } from "@/data/journals";

export type LiveJournalArticle = JournalArticle & {
  id?: string;
  status?: string;
};

function mapJournal(row: any): LiveJournalArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    content: row.content || "",
    image: row.image_url || row.image || "",
    category: row.category || "Journal",
    date: row.published_at || row.created_at || new Date().toISOString(),
    author: row.author || "Kora Sutra",
    readTime: row.read_time || "3 min read",
    keywords: row.keywords || [],
    status: row.status || "published",
  };
}

export async function fetchPublishedJournals() {
  try {
    const { data, error } = await (supabase as any)
      .from("journal_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data?.length ? data.map(mapJournal) : fallbackJournalArticles;
  } catch (error) {
    console.error("Unable to load journals:", error);
    return fallbackJournalArticles;
  }
}
