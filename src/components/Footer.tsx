import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { koraSutraLogoUrl } from '@/lib/brandAssets';

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Journals', href: '/journals' },
    { name: 'Contact', href: '/contact' },
  ],
  support: [
    { name: 'Shipping', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'Size Guide', href: '/size-guide' },
    { name: 'FAQs', href: '/faqs' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-block mb-6" aria-label="Kora Sutra - Home">
              <img src={koraSutraLogoUrl} alt="Kora Sutra - Handcrafted Sarees from Bengal" className="h-16 w-auto" loading="lazy" />
            </Link>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6 max-w-xs">
              Celebrating the art of Indian textiles with curated collections of handcrafted sarees.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <motion.a
                href="https://www.instagram.com/korasutraofficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Kora Sutra on Instagram"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-background rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </motion.a>
              <motion.a
                href="https://www.facebook.com/people/Korasutraofficial/61585129572992"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Kora Sutra on Facebook"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-background rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </motion.a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-muted-foreground font-body">
              <a href="mailto:customer.support@korasutra.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                customer.support@korasutra.com
              </a>
              <a href="tel:+917995862266" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" />
                +91 79958 62266
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Hyderabad, India
              </span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mb-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                  <line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Secure Payment</span>
              <span className="text-[10px] text-muted-foreground">256-bit SSL</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">100% Authentic</span>
              <span className="text-[10px] text-muted-foreground">Handcrafted</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/>
                  <path d="m7.5 4.27 9 5.15"/>
                  <polyline points="3.29 7 12 12 20.71 7"/>
                  <line x1="12" x2="12" y1="22" y2="12"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Free Shipping</span>
              <span className="text-[10px] text-muted-foreground">Pan India</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M12 7v5l4 2"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">Easy Returns</span>
              <span className="text-[10px] text-muted-foreground">7-Day Policy</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground">24/7 Support</span>
              <span className="text-[10px] text-muted-foreground">WhatsApp</span>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
            <span className="text-xs text-muted-foreground mr-2">We Accept:</span>
            <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-sm">
              <span className="text-xs font-medium">UPI</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-medium">Cards</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-medium">Net Banking</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-medium">Wallets</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground font-body mb-2">
            Checkout happens securely on Kora Sutra with Razorpay and COD options.
          </p>
          <p className="text-sm text-muted-foreground font-body">
            © 2025 Kora Sutra. All rights reserved. Made with ♡ in India.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground font-body">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <Link to="/legal" className="hover:text-foreground transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
