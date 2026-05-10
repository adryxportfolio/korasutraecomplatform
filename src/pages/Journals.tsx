import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { fetchPublishedJournals, type LiveJournalArticle } from '@/lib/journals';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';
import { supabase } from '@/integrations/supabase/client';

export default function Journals() {
  const [journalArticles, setJournalArticles] = useState<LiveJournalArticle[]>([]);

  useEffect(() => {
    const loadJournals = async () => setJournalArticles(await fetchPublishedJournals());
    loadJournals();
    return subscribeToStorefrontRealtime(supabase, "journals-page-sync", loadJournals, ["journal_articles"]);
  }, []);

  return (
    <>
      <Helmet>
        <title>Journals | Kora Sutra — Handloom Stories, Saree Care & Textile Heritage</title>
        <meta
          name="description"
          content="Explore the Kora Sutra journals — stories of handloom revival, Tussar silk, Muslin, Kantha stitch, Jamdani weaving, Batik, block print, and how to care for your sarees. Celebrating India's textile heritage."
        />
        <meta
          name="keywords"
          content="Kora Sutra journal, handloom blog, saree blog, Tussar silk guide, Muslin saree, Kantha stitch, Jamdani weaving, Baluchari saree, block print saree, Batik saree, silk saree care, Indian textile heritage, handwoven saree India, sustainable fashion India, saree draping guide, Bengal handloom, artisan craft India"
        />
        <link rel="canonical" href="https://korasutra.com/journals" />
        <meta property="og:title" content="Journals | Kora Sutra — Textile Stories & Heritage" />
        <meta property="og:description" content="Stories of handloom revival, artisan craft, and India's rich textile traditions." />
        <meta property="og:url" content="https://korasutra.com/journals" />
        <meta property="og:type" content="blog" />
      </Helmet>

      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header — script heading like Aadyam */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-script text-accent mb-6">
              Journals
            </h1>
            <p className="text-muted-foreground font-body text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Stories of craft, heritage, and the women who keep India's textile traditions alive.
            </p>
          </motion.div>

          {/* 3-column grid — tall images, category, title, excerpt */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {journalArticles.map((article, index) => (
              <motion.article
                key={article.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
              >
                <Link to={`/journals/${article.slug}`} className="group block">
                  {/* Tall image — 3:4 aspect ratio like Aadyam */}
                  <div className="aspect-[3/4] overflow-hidden mb-5 bg-secondary">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Category label */}
                  <span className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase font-body block mb-3">
                    {article.category}
                  </span>

                  {/* Title */}
                  <h2 className="font-heading text-lg md:text-xl text-foreground group-hover:text-accent transition-colors leading-snug mb-3">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground font-body line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
