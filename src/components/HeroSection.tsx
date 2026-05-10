import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroPortrait from '@/assets/hero-kora-sutra-0750.jpg';
import { defaultSiteSettings, type SiteSettings } from '@/lib/siteSettings';

export function HeroSection({ settings = defaultSiteSettings }: { settings?: SiteSettings }) {
  const hero = settings.hero;
  const hasCustomDesktopImage = Boolean(hero.desktopImageUrl);
  const hasCustomMobileImage = Boolean(hero.mobileImageUrl);
  const desktopImage = hero.desktopImageUrl || heroPortrait;
  const mobileImage = hero.mobileImageUrl || heroPortrait;
  const ctaHref = hero.ctaHref || defaultSiteSettings.hero.ctaHref;
  const ctaText = hero.ctaText || defaultSiteSettings.hero.ctaText;
  const altText = hero.altText || defaultSiteSettings.hero.altText;

  return (
    <section className="relative w-full overflow-hidden">
      {/* Desktop Hero */}
      <div className="hidden md:block relative w-full">
        <Link
          to={ctaHref}
          className={
            hasCustomDesktopImage
              ? "block relative w-full"
              : "group relative flex w-full items-center justify-center overflow-hidden bg-[#e7e0d4] md:min-h-[620px] md:h-[min(88svh,860px)] lg:min-h-[680px] lg:h-[min(82svh,900px)]"
          }
        >
          {hasCustomDesktopImage ? (
            <img
              src={desktopImage}
              alt={altText}
              className="w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <>
              <img
                src={desktopImage}
                alt=""
                aria-hidden="true"
                width={352}
                height={470}
                className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-2xl opacity-60 saturate-[0.9]"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/35 via-background/5 to-background/40" />
              <div className="relative flex h-full w-full max-w-[1680px] items-center justify-center px-8 md:px-10 lg:justify-start lg:px-16">
                <img
                  src={desktopImage}
                  alt={altText}
                  width={352}
                  height={470}
                  className="h-[78%] max-h-[760px] w-auto rounded-sm object-contain shadow-[0_30px_90px_hsl(var(--foreground)/0.24)] ring-1 ring-background/45 transition-transform duration-700 group-hover:scale-[1.01] lg:h-[82%]"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </>
          )}
          {/* CTA overlay on right side matching the design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute bottom-8 left-0 right-0 mx-auto w-fit lg:bottom-16 lg:left-auto lg:right-16 lg:mx-0"
          >
            <span className="inline-flex items-center justify-center px-10 py-4 bg-primary text-primary-foreground font-body text-sm tracking-widest uppercase rounded-sm hover:bg-primary/90 transition-colors shadow-lg">
              {ctaText}
            </span>
          </motion.div>
        </Link>
      </div>

      {/* Mobile Hero */}
      <div className="md:hidden relative w-full">
        <Link
          to={ctaHref}
          className={hasCustomMobileImage ? "block relative w-full" : "block relative w-full aspect-[352/470] overflow-hidden bg-[#e7e0d4]"}
        >
          {hasCustomMobileImage ? (
            <img
              src={mobileImage}
              alt={altText}
              className="w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <img
              src={mobileImage}
              alt={altText}
              width={352}
              height={470}
              className="h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
          )}
        </Link>
      </div>
    </section>
  );
}
