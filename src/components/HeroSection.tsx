import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroDesktop from '@/assets/hero-korasutra-desktop-1920.jpg';
import heroLaptop from '@/assets/hero-korasutra-laptop-1600.jpg';
import heroTablet from '@/assets/hero-korasutra-tablet-1200.jpg';
import heroMobile from '@/assets/hero-korasutra-mobile-1080.jpg';
import { defaultSiteSettings, type SiteSettings } from '@/lib/siteSettings';

export function HeroSection({ settings = defaultSiteSettings }: { settings?: SiteSettings }) {
  const hero = settings.hero;
  const hasCustomDesktopImage = Boolean(hero.desktopImageUrl);
  const hasCustomMobileImage = Boolean(hero.mobileImageUrl);
  const desktopImage = hero.desktopImageUrl || heroDesktop;
  const mobileImage = hero.mobileImageUrl || heroMobile;
  const ctaHref = "/collections/all";
  const ctaText = "Explore Our Collection";
  const altText = hero.altText || defaultSiteSettings.hero.altText;

  return (
    <section className="relative w-full overflow-hidden bg-[#e7e0d4]">
      <Link to={ctaHref} className="group block relative w-full">
        {hasCustomDesktopImage || hasCustomMobileImage ? (
          <picture>
            <source media="(min-width: 768px)" srcSet={desktopImage} />
            <img
              src={mobileImage}
              alt={altText}
              className="block w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          </picture>
        ) : (
          <picture>
            <source media="(min-width: 1280px)" srcSet={heroDesktop} />
            <source media="(min-width: 1024px)" srcSet={heroLaptop} />
            <source media="(min-width: 768px)" srcSet={heroTablet} />
            <img
              src={heroMobile}
              alt={altText}
              width={1080}
              height={1440}
              className="block w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          </picture>
        )}

        <div className="absolute inset-x-0 bottom-6 flex justify-center px-4 md:bottom-10 lg:bottom-14 lg:justify-end lg:px-16">
          <motion.span
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-7 py-3 text-center font-body text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_18px_45px_hsl(var(--foreground)/0.28)] ring-1 ring-background/40 transition-all duration-300 hover:bg-primary/90 group-hover:-translate-y-0.5 md:min-h-14 md:px-10 md:py-4 md:text-sm"
          >
            {ctaText}
          </motion.span>
        </div>
      </Link>
    </section>
  );
}
