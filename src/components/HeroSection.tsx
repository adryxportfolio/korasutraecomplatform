import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroDesktop from '@/assets/hero-desktop.png';
import heroMobile from '@/assets/hero-mobile.png';
import { defaultSiteSettings, type SiteSettings } from '@/lib/siteSettings';

export function HeroSection({ settings = defaultSiteSettings }: { settings?: SiteSettings }) {
  const hero = settings.hero;
  const desktopImage = hero.desktopImageUrl || heroDesktop;
  const mobileImage = hero.mobileImageUrl || heroMobile;
  const ctaHref = hero.ctaHref || defaultSiteSettings.hero.ctaHref;
  const ctaText = hero.ctaText || defaultSiteSettings.hero.ctaText;
  const altText = hero.altText || defaultSiteSettings.hero.altText;

  return (
    <section className="relative w-full overflow-hidden">
      {/* Desktop Hero */}
      <div className="hidden md:block relative w-full">
        <Link to={ctaHref} className="block relative w-full">
          <img
            src={desktopImage}
            alt={altText}
            className="w-full h-auto object-cover"
            loading="eager"
          />
          {/* CTA overlay on right side matching the design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute bottom-12 right-12 lg:bottom-16 lg:right-16"
          >
            <span className="inline-flex items-center justify-center px-10 py-4 bg-primary text-primary-foreground font-body text-sm tracking-widest uppercase rounded-sm hover:bg-primary/90 transition-colors shadow-lg">
              {ctaText}
            </span>
          </motion.div>
        </Link>
      </div>

      {/* Mobile Hero */}
      <div className="md:hidden relative w-full">
        <Link to={ctaHref} className="block relative w-full">
          <img
            src={mobileImage}
            alt={altText}
            className="w-full h-auto object-cover"
            loading="eager"
          />
        </Link>
      </div>
    </section>
  );
}
