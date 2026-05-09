import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: "https://korasutra.com/terms" }
  ]
};

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - Kora Sutra | Legal Terms for Handcrafted Sarees</title>
        <meta 
          name="description" 
          content="Read Kora Sutra's terms and conditions. Understand our policies on purchases, intellectual property, liability, and use of our handcrafted sarees website." 
        />
        <meta name="keywords" content="Kora Sutra terms, terms and conditions, legal terms, saree purchase terms" />
        <link rel="canonical" href="https://korasutra.com/terms" />
        
        <meta property="og:title" content="Terms & Conditions - Kora Sutra" />
        <meta property="og:description" content="Read our terms and conditions for shopping handcrafted sarees." />
        <meta property="og:url" content="https://korasutra.com/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Terms & Conditions - Kora Sutra" />
        <meta name="twitter:description" content="Read our terms and conditions for shopping handcrafted sarees." />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Terms & Conditions</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing and using the Kora Sutra website, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">2. Use of Website</h2>
                <p className="text-muted-foreground mb-4">
                  This website is for informational, brand discovery, and e-commerce purposes. Purchases are processed through Kora Sutra's secure checkout.
                </p>
                <p className="text-muted-foreground mb-4">
                  You agree to use this website only for lawful purposes and in a way that does not infringe on the rights of others or restrict their use of the website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">3. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  All content on this website, including text, images, logos, and designs, is the property of Kora Sutra and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or use any content without our prior written consent.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">4. Product Information</h2>
                <p className="text-muted-foreground mb-4">
                  We strive to display our products accurately. However, slight variations in color may occur due to screen settings. For accurate product details and availability, please refer to the product pages on our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">5. E-Commerce & Payments</h2>
                <p className="text-muted-foreground mb-4">
                  Online transactions are processed securely through Razorpay. Cash on Delivery orders include the surcharge shown at checkout.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">6. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  Kora Sutra shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">7. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">8. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms & Conditions, please contact us at customer.support@korasutra.com or call +91 79958 62266.
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
