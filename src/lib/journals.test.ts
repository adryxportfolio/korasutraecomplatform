import { describe, expect, test } from "bun:test";
import { buildEditableJournalRows } from "./journalAdminRows";
import type { JournalArticle } from "@/data/journals";

const fallbackArticles: JournalArticle[] = [
  {
    slug: "legacy-care-guide",
    title: "Legacy Care Guide",
    excerpt: "Care excerpt",
    content: "Care content",
    image: "https://example.com/care.jpg",
    author: "Kora Sutra",
    date: "2025-02-01",
    category: "Care",
    readTime: "4 min read",
    keywords: ["silk", "care"],
  },
  {
    slug: "legacy-weave-story",
    title: "Legacy Weave Story",
    excerpt: "Weave excerpt",
    content: "Weave content",
    image: "https://example.com/weave.jpg",
    author: "Kora Sutra",
    date: "2025-01-01",
    category: "Journal",
    readTime: "5 min read",
    keywords: ["handloom"],
  },
];

describe("editable journal rows", () => {
  test("includes older static journal articles as editable published rows", () => {
    const rows = buildEditableJournalRows([], fallbackArticles);

    expect(rows.map((row) => row.slug)).toEqual(["legacy-care-guide", "legacy-weave-story"]);
    expect(rows[0]).toEqual({
      slug: "legacy-care-guide",
      title: "Legacy Care Guide",
      excerpt: "Care excerpt",
      content: "Care content",
      image_url: "https://example.com/care.jpg",
      category: "Care",
      author: "Kora Sutra",
      read_time: "4 min read",
      keywords: ["silk", "care"],
      status: "published",
      published_at: "2025-02-01",
    });
  });

  test("prefers live database rows over legacy rows with the same slug", () => {
    const rows = buildEditableJournalRows([
      {
        id: "db-1",
        slug: "legacy-care-guide",
        title: "Updated Care Guide",
        status: "draft",
      },
    ], fallbackArticles);

    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Updated Care Guide");
    expect(rows[0].status).toBe("draft");
  });
});
