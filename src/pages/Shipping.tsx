import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Shipping Policy", item: "https://korasutra.com/shipping" }
  ]
};

export default function Shipping() {
  return (
    <>
      <Helmet>
        <title>Shipping Policy - Kora Sutra | Delivery Information for Handcrafted Sarees</title>
        <meta 
          name="description" 
          content="Learn about Kora Sutra's shipping policy. We deliver handcrafted sarees across India. Metro cities: 3-5 days, Tier 2 cities: 5-7 days. Free shipping available." 
        />
        <meta name="keywords" content="Kora Sutra shipping, saree delivery, shipping policy India, free shipping sarees, delivery time" />
        <link rel="canonical" href="https://korasutra.com/shipping" />
        
        <meta property="og:title" content="Shipping Policy - Kora Sutra" />
        <meta property="og:description" content="Learn about our shipping policy. We deliver handcrafted sarees across India." />
        <meta property="og:url" content="https://korasutra.com/shipping" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Shipping Policy - Kora Sutra" />
        <meta name="twitter:description" content="Learn about our shipping policy for handcrafted sarees delivery across India." />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Shipping Policy</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Shipping Coverage</h2>
                <p className="text-muted-foreground mb-4">
                  We currently ship to all major cities and towns across India. Delivery is available to most PIN codes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Delivery Timeline</h2>
                <div className="bg-secondary/50 rounded-sm p-6 mb-4">
                  <ul className="space-y-3 text-muted-foreground">
                    <li><strong>Metro Cities:</strong> 3-5 business days</li>
                    <li><strong>Tier 2 Cities:</strong> 5-7 business days</li>
                    <li><strong>Other Locations:</strong> 7-10 business days</li>
                  </ul>
                </div>
                <p className="text-muted-foreground text-sm">
                  *Delivery times may vary during sale periods, festivals, and unforeseen circumstances.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Shipping Charges</h2>
                <p className="text-muted-foreground mb-4">
                  Shipping charges are calculated at checkout based on your location and order value. Free shipping may be available on eligible orders and will be shown before payment.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Order Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  Once your order is dispatched, you will receive a tracking number via SMS and email. You can use this to track your package on the courier partner's website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Packaging</h2>
                <p className="text-muted-foreground mb-4">
                  Each saree is carefully packaged to ensure it reaches you in perfect condition. Our packaging is elegant and makes for a perfect gift.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Delivery Issues</h2>
                <p className="text-muted-foreground mb-4">
                  If you face any issues with delivery—such as delayed or damaged packages—please contact us immediately at customer.support@korasutra.com or +91 79958 62266. We will work with our courier partner to resolve the issue promptly.
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
