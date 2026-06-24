import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const megaMenuData = {
  'Shop by Fabric': [
    { name: 'Tussar Silk', href: '/collections/tussar' },
    { name: 'Matka Silk', href: '/collections/matka' },
    { name: 'Muslin', href: '/collections/muslin' },
    { name: 'Pure Silk', href: '/collections/pure-silk' },
    { name: 'Katan Silk', href: '/collections/katan-silk' },
    { name: 'Linen', href: '/collections/linen' },
    { name: 'Cotton', href: '/collections/cotton' },
  ],
  'Shop by Pattern': [
    { name: 'Jamdani', href: '/collections/jamdani' },
    { name: 'Kantha Stitch', href: '/collections/kantha-stitch' },
    { name: 'Baluchari', href: '/collections/baluchari' },
    { name: 'Hand Paint', href: '/collections/hand-paint' },
    { name: 'Block Print', href: '/collections/block-print' },
    { name: 'Batik', href: '/collections/batik' },
    { name: 'Digital Print', href: '/collections/digital-print' },
    { name: 'Paithani', href: '/collections/paithani' },
  ],
  'Shop by Occasion': [
    { name: 'Traditional', href: '/collections/traditional' },
    { name: 'Casual', href: '/collections/casual' },
    { name: 'Office Wear', href: '/collections/office-wear' },
    { name: 'Party Wear', href: '/collections/party-wear' },
    { name: 'Wedding', href: '/collections/best-sellers' },
    { name: 'Festive', href: '/collections/best-sellers' },
  ],
};

const quickLinks = [
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Best Sellers', href: '/collections/best-sellers' },
  { name: 'All Sarees', href: '/collections/all' },
  { name: 'Blouses', href: '/collections/blouse' },
  { name: 'Saree With Blouse Piece', href: '/collections/all?blousePiece=with' },
  { name: 'Saree Without Blouse', href: '/collections/all?blousePiece=without' },
];

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, []);

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const scheduleClose = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 250);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => setIsOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        className="hidden lg:block relative"
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
      >
        <button
          ref={buttonRef}
          className="flex items-center gap-1 text-sm font-body tracking-wide text-foreground hover:text-accent transition-colors py-2"
          onClick={() => {
            if (!isOpen) {
              open();
            } else {
              setIsOpen(false);
            }
          }}
        >
          Collections
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              }}
              onMouseLeave={scheduleClose}
              style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                transform: 'translateX(-50%)',
                zIndex: 9999,
              }}
              className="w-[700px] bg-background border border-border shadow-elegant rounded-sm"
            >
              <div className="p-6">
                <div className="grid grid-cols-4 gap-6">
                  {Object.entries(megaMenuData).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground mb-3">
                        {category}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              onClick={() => setIsOpen(false)}
                              className="text-sm font-body text-foreground/80 hover:text-accent transition-colors block py-0.5"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div>
                    <h3 className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground mb-3">
                      Quick Links
                    </h3>
                    <ul className="space-y-2">
                      {quickLinks.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-body text-accent font-medium hover:text-accent/80 transition-colors block py-0.5"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-body italic leading-relaxed">
                        "Celebrating Bengal's textile heritage, one saree at a time."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
