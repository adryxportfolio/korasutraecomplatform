import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Returns Policy", item: "https://korasutra.com/returns" }
  ]
};

export default function Returns() {
  return (
    <>
      <Helmet>
        <title>Returns & Exchange Policy - Korasutra | Easy Returns for Handcrafted Sarees</title>
        <meta 
          name="description" 
          content="Learn about Kora Sutra's returns policy. Easy 7-day returns with unboxing video proof. Free returns on damaged products. Hassle-free refund process." 
        />
        <meta name="keywords" content="Kora Sutra returns, saree exchange, return policy, refund policy, easy returns" />
        <link rel="canonical" href="https://korasutra.com/returns" />
        
        <meta property="og:title" content="Returns & Exchange Policy - Korasutra" />
        <meta property="og:description" content="Easy 7-day returns with hassle-free refund process for handcrafted sarees." />
        <meta property="og:url" content="https://korasutra.com/returns" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Returns & Exchange Policy - Korasutra" />
        <meta name="twitter:description" content="Easy 7-day returns with hassle-free refund process for handcrafted sarees." />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Returns Policy</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <div className="bg-primary/10 border-l-4 border-primary p-6 mb-8 rounded-sm">
                <h3 className="text-lg font-heading mb-2 text-primary">Important: Video Proof Required</h3>
                <p className="text-muted-foreground">
                  <strong>All return and exchange requests must include an unboxing video.</strong> This video must clearly show the package being opened for the first time and the product being inspected. Return requests without valid video proof will not be processed.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Return Eligibility</h2>
                <p className="text-muted-foreground mb-4">
                  Returns are accepted under the following conditions:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Request made within 7 days of delivery</li>
                  <li>Product is unused and in original condition</li>
                  <li>All tags and packaging are intact</li>
                  <li>Unboxing video is provided as proof</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Non-Returnable Items</h2>
                <p className="text-muted-foreground mb-4">
                  The following items cannot be returned:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Products marked as "Final Sale" or "Non-Returnable"</li>
                  <li>Customized or altered products</li>
                  <li>Products without original packaging and tags</li>
                  <li>Products returned without unboxing video</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">How to Initiate a Return</h2>
                <ol className="list-decimal pl-6 text-muted-foreground mb-4">
                  <li className="mb-2">Email us at customer.support@korasutra.com with your order number</li>
                  <li className="mb-2">Attach your unboxing video clearly showing the issue</li>
                  <li className="mb-2">Describe the reason for return</li>
                  <li className="mb-2">Our team will review and respond within 24-48 hours</li>
                  <li className="mb-2">If approved, you'll receive return shipping instructions</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Refund Process</h2>
                <p className="text-muted-foreground mb-4">
                  Once we receive and inspect the returned product, refunds will be processed to the original payment method within 5-7 business days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Exchanges</h2>
                <p className="text-muted-foreground mb-4">
                  If you wish to exchange a product for a different size or color, please follow the same return process and place a new order. This ensures faster processing.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Damaged or Defective Products</h2>
                <p className="text-muted-foreground mb-4">
                  If you receive a damaged or defective product, please contact us within 24 hours of delivery with photos and the unboxing video. We will arrange for a replacement or full refund at no extra cost.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For return-related queries, reach us at customer.support@korasutra.com or call +91 79958 62266.
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
