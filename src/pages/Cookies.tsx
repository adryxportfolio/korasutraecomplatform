import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Cookie Policy", item: "https://korasutra.com/cookies" }
  ]
};

export default function Cookies() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - Kora Sutra | How We Use Cookies</title>
        <meta 
          name="description" 
          content="Learn about how Kora Sutra uses cookies on our website. Understand essential, analytics, and functional cookies for a better shopping experience." 
        />
        <meta name="keywords" content="Kora Sutra cookies, cookie policy, website cookies, privacy" />
        <link rel="canonical" href="https://korasutra.com/cookies" />
        
        <meta property="og:title" content="Cookie Policy - Kora Sutra" />
        <meta property="og:description" content="Understand how Kora Sutra uses cookies to enhance your shopping experience." />
        <meta property="og:url" content="https://korasutra.com/cookies" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://korasutra.com/og-image.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Cookie Policy - Kora Sutra" />
        <meta name="twitter:description" content="Understand how Kora Sutra uses cookies to enhance your shopping experience." />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Cookie Policy</h1>
            <p className="text-muted-foreground font-body mb-6">Last updated: January 2025</p>
            
            <div className="prose prose-lg max-w-none font-body text-foreground">
              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">1. What Are Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  Cookies are small text files stored on your device when you visit our website. They help us provide you with a better browsing experience and are essential for certain website features to function properly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">2. How We Use Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Remember your preferences and settings</li>
                  <li>Keep items in your shopping cart</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Improve website functionality and performance</li>
                  <li>Enable secure checkout processes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">3. Types of Cookies We Use</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Essential Cookies:</strong> Required for basic website functionality, including navigation, cart functionality, and secure checkout. These cannot be disabled.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website, which pages are most popular, and how to improve user experience.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Functional Cookies:</strong> Remember your preferences such as language, region, and display settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">4. Commerce Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  Our website uses essential commerce cookies and local storage for cart, checkout, and account-session functionality. These may include:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li><strong>korasutra-cart:</strong> Stores your shopping cart contents</li>
                  <li><strong>ks_demo_customer:</strong> Temporary checkout verification state</li>
                  <li><strong>ks_admin_token:</strong> Admin session token for secure dashboard access</li>
                  <li><strong>analytics identifiers:</strong> Helps us understand site performance</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  These are necessary for the shopping and checkout experience to function correctly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">5. Third-Party Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  We may also use third-party cookies from services like:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>Google Analytics for website traffic analysis</li>
                  <li>Social media platforms for sharing features</li>
                  <li>Payment processors for secure transactions</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  These third parties have their own privacy policies governing the use of cookies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">6. Managing Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  You can control cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete all or specific cookies</li>
                  <li>Block cookies from all or specific websites</li>
                  <li>Set preferences for different types of cookies</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  <strong>Note:</strong> Disabling essential cookies may affect your ability to use the shopping cart and checkout features on our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">7. Cookie Retention</h2>
                <p className="text-muted-foreground mb-4">
                  Cookies have varying lifespans:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until manually deleted</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">8. Updates to This Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about our cookie policy, contact us at customer.support@korasutra.com or call +91 79958 62266.
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
