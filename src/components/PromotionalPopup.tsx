import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { defaultSiteSettings, type SitePromoPopupSettings } from "@/lib/siteSettings";

const POPUP_STORAGE_PREFIX = "korasutra-promo-popup-dismissed";

export function PromotionalPopup({ settings = defaultSiteSettings.promoPopup }: { settings?: SitePromoPopupSettings }) {
  const [show, setShow] = useState(false);
  const storageKey = useMemo(
    () => `${POPUP_STORAGE_PREFIX}:${settings.title}:${settings.code}:${settings.discountLabel}`,
    [settings.code, settings.discountLabel, settings.title],
  );

  useEffect(() => {
    setShow(false);
    if (!settings.enabled) return undefined;

    const dismissed = sessionStorage.getItem(storageKey);
    if (dismissed) return undefined;

    const timer = setTimeout(() => setShow(true), settings.delayMs);
    return () => clearTimeout(timer);
  }, [settings.delayMs, settings.enabled, storageKey]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(storageKey, "true");
  };

  if (!settings.enabled) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative bg-background border border-border rounded-lg shadow-elegant max-w-sm w-full pointer-events-auto text-center overflow-hidden">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary/50 transition-colors z-10"
                aria-label="Close promotion"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

              <div className="px-6 py-8">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <Gift className="w-7 h-7 text-accent" />
                </div>

                {settings.title && (
                  <h3 className="font-heading text-2xl text-foreground mb-1">
                    {settings.title}
                  </h3>
                )}
                {settings.body && (
                  <p className="text-muted-foreground font-body text-sm mb-4">
                    {settings.body}
                  </p>
                )}

                {(settings.discountLabel || settings.code) && (
                  <div className="bg-secondary/50 rounded-md py-4 px-3 mb-5">
                    {settings.discountLabel && (
                      <p className="font-price text-5xl md:text-6xl text-primary mb-1 font-bold">
                        {settings.discountLabel}
                      </p>
                    )}
                    {settings.code && (
                      <>
                        <p className="text-muted-foreground text-xs font-body tracking-wide">
                          Use code at checkout
                        </p>
                        <span className="inline-block mt-2 px-4 py-1.5 border-2 border-dashed border-accent rounded font-heading text-lg text-accent tracking-widest">
                          {settings.code}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <Button asChild className="w-full rounded-sm font-body text-sm tracking-wide uppercase">
                  <Link to={settings.ctaHref || "/collections/all"} onClick={handleDismiss}>
                    {settings.ctaText || "Shop Now"}
                  </Link>
                </Button>

                {settings.finePrint && (
                  <p className="text-muted-foreground text-[10px] font-body mt-3">
                    {settings.finePrint}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
