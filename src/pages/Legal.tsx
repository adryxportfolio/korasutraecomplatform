import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Legal", item: "https://korasutra.com/legal" }
  ]
};

export default function Legal() {
  return (
    <>
      <Helmet>
        <title>Legal Disclaimer - Korasutra | Business & Liability Information</title>
        <meta 
          name="description" 
          content="Read Kora Sutra's legal disclaimer. Understand our business entity, liability limitations, and proprietor responsibilities for handcrafted saree sales." 
        />
        <meta name="keywords" content="Kora Sutra legal, legal disclaimer, business information, liability" />
        <link rel="canonical" href="https://korasutra.com/legal" />
        
        <meta property="og:title" content="Legal Disclaimer - Korasutra" />
        <meta property="og:description" content="Legal information including business registration and liability details." />
        <meta property="og:url" content="https://korasutra.com/legal" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Legal Disclaimer - Korasutra" />
        <meta name="twitter:description" content="Legal information for Kora Sutra including business and liability details." />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Legal Disclaimer</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">1. Business Entity</h2>
                <p className="text-muted-foreground mb-4">
                  Kora Sutra is a proprietary business. The proprietor of Kora Sutra is solely responsible for all business operations, legal obligations, liabilities, and compliance with applicable laws and regulations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">2. Website Development Disclaimer</h2>
                <p className="text-muted-foreground mb-4">
                  This website was developed by <strong>Adreej</strong>, a freelance web developer. Adreej has provided web development services solely for the creation and design of this website.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Important:</strong> Adreej, as the web developer, is <strong>NOT liable</strong> for any legal obligations, business disputes, product quality issues, customer complaints, financial matters, tax compliance, or any other legal responsibilities related to Kora Sutra's business operations.
                </p>
                <p className="text-muted-foreground mb-4">
                  All legal responsibility lies solely with <strong>Kora Sutra and its proprietor</strong>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">3. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  The freelance web developer (Adreej) shall not be held responsible for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Any products sold or services rendered by Kora Sutra</li>
                  <li>Customer disputes, refunds, or complaints</li>
                  <li>Business licensing or regulatory compliance</li>
                  <li>Tax obligations or financial liabilities</li>
                  <li>Content accuracy on product descriptions or pricing</li>
                  <li>Third-party integrations or payment processing issues</li>
                  <li>Data breaches or security incidents beyond reasonable development practices</li>
                  <li>Any damages arising from the use or inability to use this website</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">4. Proprietor Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  The proprietor of Kora Sutra is responsible for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>All business operations and decisions</li>
                  <li>Product sourcing, quality, and authenticity</li>
                  <li>Customer service and dispute resolution</li>
                  <li>Compliance with consumer protection laws</li>
                  <li>Tax registration and compliance (GST, Income Tax, etc.)</li>
                  <li>Business licensing and permits</li>
                  <li>Shipping, returns, and refund policies</li>
                  <li>Data protection and privacy compliance</li>
                  <li>Marketing claims and advertisements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">5. E-Commerce Platform</h2>
                <p className="text-muted-foreground mb-4">
                  This website operates on Kora Sutra's self-hosted commerce platform. Payments are processed securely through Razorpay, and Kora Sutra is responsible for catalog, checkout, order management, and fulfilment.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">6. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  All brand names, logos, product images, and content on this website are the intellectual property of Kora Sutra unless otherwise stated. Any unauthorized use, reproduction, or distribution is prohibited.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">7. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  This legal disclaimer and all matters related to Kora Sutra's business operations shall be governed by the laws of India. Any legal disputes shall be subject to the jurisdiction of courts in India.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">8. Contact Information</h2>
                <p className="text-muted-foreground mb-4">
                  For any legal inquiries or concerns, please contact:
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Kora Sutra</strong><br />
                  Email: customer.support@korasutra.com<br />
                  Phone: +91 74166 44554
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">9. Related Policies</h2>
                <p className="text-muted-foreground mb-4">
                  Please also review our other policies:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li><Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link></li>
                  <li><Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></li>
                  <li><Link to="/returns" className="text-primary hover:underline">Returns & Refunds</Link></li>
                  <li><Link to="/shipping" className="text-primary hover:underline">Shipping Policy</Link></li>
                </ul>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
