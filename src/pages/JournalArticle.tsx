import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { fetchPublishedJournals, type LiveJournalArticle } from '@/lib/journals';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';
import { supabase } from '@/integrations/supabase/client';
import { koraSutraStructuredDataLogoUrl } from '@/lib/brandAssets';

export default function JournalArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [journalArticles, setJournalArticles] = useState<LiveJournalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJournals = async () => {
      setJournalArticles(await fetchPublishedJournals());
      setIsLoading(false);
    };
    loadJournals();
    return subscribeToStorefrontRealtime(supabase, `journal-article-${slug || "unknown"}`, loadJournals, ["journal_articles"]);
  }, [slug]);

  const article = journalArticles.find(a => a.slug === slug);
  const currentIndex = journalArticles.findIndex(a => a.slug === slug);
  const nextArticle = currentIndex >= 0 && currentIndex < journalArticles.length - 1
    ? journalArticles[currentIndex + 1]
    : null;
  const prevArticle = currentIndex > 0
    ? journalArticles[currentIndex - 1]
    : null;

  if (!article && !isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-heading mb-4">Article not found</h1>
            <Link to="/journals" className="text-accent hover:underline">Back to Journals</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16" />
        <Footer />
      </>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Korasutra",
      logo: { "@type": "ImageObject", url: koraSutraStructuredDataLogoUrl }
    },
    mainEntityOfPage: `https://korasutra.com/journals/${article.slug}`,
    keywords: article.keywords.join(', ')
  };

  const paragraphs = article.content.split('\n\n').filter(p => p.trim());

  return (
    <>
      <Helmet>
        <title>{article.title} | Korasutra Journals</title>
        <meta name="description" content={article.excerpt} />
        <meta name="keywords" content={article.keywords.join(', ')} />
        <link rel="canonical" href={`https://korasutra.com/journals/${article.slug}`} />
        <meta property="og:title" content={`${article.title} | Korasutra`} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.image} />
        <meta property="og:url" content={`https://korasutra.com/journals/${article.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.image} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <Navbar />
      <main className="min-h-screen pt-28 pb-16">
        <article className="container mx-auto px-4 md:px-6 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-body">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/journals" className="hover:text-foreground transition-colors">Journals</Link>
            <span>/</span>
            <span className="text-foreground truncate">{article.title}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Category */}
            <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase font-body block mb-4">
              {article.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-light leading-tight mb-6">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mb-8 pb-8 border-b border-border">
              <span>By {article.author}</span>
              <span>·</span>
              <span>{new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>·</span>
              <span>{article.readTime}</span>
            </div>

            {/* Hero Image */}
            <div className="aspect-[16/9] overflow-hidden mb-10">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none font-body text-foreground/85 leading-relaxed space-y-6">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
              {article.keywords.map(keyword => (
                <span
                  key={keyword}
                  className="px-3 py-1 text-xs font-body border border-border rounded-full text-muted-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
            {prevArticle ? (
              <Link
                to={`/journals/${prevArticle.slug}`}
                className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="hidden md:inline">{prevArticle.title}</span>
                <span className="md:hidden">Previous</span>
              </Link>
            ) : <div />}
            {nextArticle ? (
              <Link
                to={`/journals/${nextArticle.slug}`}
                className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span className="hidden md:inline">{nextArticle.title}</span>
                <span className="md:hidden">Next</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : <div />}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
