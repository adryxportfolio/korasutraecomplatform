import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://korasutra.com/privacy" }
  ]
};

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Korasutra | Data Protection & Security</title>
        <meta 
          name="description" 
          content="Read Kora Sutra's privacy policy. Learn how we protect your personal data, handle payments securely, and respect your privacy when you shop for handcrafted sarees." 
        />
        <meta name="keywords" content="Kora Sutra privacy, privacy policy, data protection, secure shopping, personal data" />
        <link rel="canonical" href="https://korasutra.com/privacy" />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you voluntarily provide, such as your name, email address, phone number, and shipping address when you make a purchase or subscribe to our newsletter. We may also collect basic analytics data to improve our website experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  Your information is used to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Process and fulfill your orders</li>
                  <li>Send you updates about new collections and offers</li>
                  <li>Improve our website and services</li>
                  <li>Respond to your inquiries</li>
                  <li>Provide customer support</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">3. Data Protection</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate security measures to protect your personal information. We do not sell, trade, or transfer your information to third parties without your consent, except as required to fulfill your orders or comply with legal obligations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">4. Payment & Purchase Data</h2>
                <p className="text-muted-foreground mb-4">
                  Purchases are processed securely through Razorpay or Cash on Delivery. Kora Sutra stores order, contact, shipping, and payment reference details needed for fulfilment, but does not store complete card or banking details.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">5. Cookies & Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  Our website uses cookies and local storage to enhance your browsing experience, remember cart contents, support checkout, and analyze site traffic. You can manage cookie preferences through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Access your personal data</li>
                  <li>Request correction of your data</li>
                  <li>Request deletion of your data</li>
                  <li>Unsubscribe from communications</li>
                  <li>Opt-out of marketing emails</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">7. Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">
                  We use Supabase for database services, Razorpay for payments, Resend for transactional email, and WhatsApp OTP delivery for account and checkout verification.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">8. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For privacy-related inquiries, contact us at customer.support@korasutra.com or call +91 79958 62266.
                </p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
