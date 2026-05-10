import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPublishedJournals, type LiveJournalArticle } from '@/lib/journals';
import { subscribeToStorefrontRealtime } from '@/lib/realtimeTables';
import { supabase } from '@/integrations/supabase/client';

const INITIAL_COUNT = 3;

export function JournalsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [showAll, setShowAll] = useState(false);
  const [journalArticles, setJournalArticles] = useState<LiveJournalArticle[]>([]);

  useEffect(() => {
    const loadJournals = async () => setJournalArticles(await fetchPublishedJournals());
    loadJournals();
    return subscribeToStorefrontRealtime(supabase, "home-journals-sync", loadJournals, ["journal_articles"]);
  }, []);

  const visibleArticles = showAll ? journalArticles : journalArticles.slice(0, INITIAL_COUNT);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header — script heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-script text-accent mb-4">
            Journals
          </h2>
          <p className="text-muted-foreground font-body text-sm max-w-lg mx-auto">
            Stories of craft, heritage, and the women who keep India's textile traditions alive.
          </p>
        </motion.div>

        {/* 3-column grid with tall images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {visibleArticles.map((article, index) => (
            <motion.article
              key={article.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/journals/${article.slug}`} className="group block">
                {/* Tall image */}
                <div className="aspect-[3/4] overflow-hidden mb-5 bg-secondary">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Category */}
                <span className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase font-body block mb-3">
                  {article.category}
                </span>

                {/* Title */}
                <h3 className="font-heading text-lg md:text-xl text-foreground group-hover:text-accent transition-colors leading-snug mb-3">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-muted-foreground font-body line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Load More / View All */}
        {!showAll && journalArticles.length > INITIAL_COUNT && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center mt-14"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(true)}
              className="group"
            >
              Load More Journals
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        )}

        {showAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mt-14"
          >
            <Button asChild variant="outline" size="lg" className="group">
              <Link to="/journals">
                View All Journals
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
