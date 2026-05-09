import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const artisanImages = [
  'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/MaroonPureSilkKantha1.jpg?v=1767428179',
  'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/16B10BD3-7E27-4F6E-9062-F26B89A6BF65.jpg?v=1767666128',
  'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/IMG_8389.png?v=1768012655',
];

export function ArtisanSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-3 md:gap-4"
          >
            <div className="space-y-3 md:space-y-4">
              <div className="aspect-[3/4] overflow-hidden rounded-sm">
                <img
                  src={artisanImages[0]}
                  alt="Bengal artisan weaving a handloom saree on a traditional loom"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="space-y-3 md:space-y-4 pt-8">
              <div className="aspect-[3/4] overflow-hidden rounded-sm">
                <img
                  src={artisanImages[1]}
                  alt="Close-up of intricate handwoven textile patterns by Kora Sutra artisans"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-sm">
                <img
                  src={artisanImages[2]}
                  alt="Handcrafted saree fabric showing the detail of Bengal's weaving heritage"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-sm tracking-[0.3em] text-muted-foreground uppercase mb-4 block font-body">
              Our Artisans
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-light mb-6">
              Hands That Weave
              <br />
              <span className="italic text-accent">Generations of Craft</span>
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-6">
              Each saree is woven by hand in Bengal's villages, by artisans who have practised 
              their craft for generations. Their looms tell stories — of patience, of precision, 
              and of a deep reverence for textile traditions that date back centuries.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-6">
              At Kora Sutra, we work directly with these weaver families, ensuring fair wages 
              and preserving the art forms that make each piece truly one-of-a-kind. When you 
              choose a Kora Sutra saree, you're not just wearing fabric — you're carrying forward 
              a living heritage.
            </p>
            <div className="flex items-center gap-8 pt-4 border-t border-border">
              <div className="text-center">
                <span className="text-2xl font-heading text-accent font-price">50+</span>
                <p className="text-xs text-muted-foreground font-body mt-1">Artisan Families</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-heading text-accent font-price">5</span>
                <p className="text-xs text-muted-foreground font-body mt-1">Generations of Craft</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-heading text-accent font-price">100%</span>
                <p className="text-xs text-muted-foreground font-body mt-1">Handwoven</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
