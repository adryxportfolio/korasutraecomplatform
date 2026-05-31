import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '+917416644554';
const WHATSAPP_MESSAGE = 'Hey!';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://korasutra.com" },
    { "@type": "ListItem", position: 2, name: "Contact Us", item: "https://korasutra.com/contact" }
  ]
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Kora Sutra",
  description: "Get in touch with Kora Sutra for inquiries about handcrafted sarees",
  url: "https://korasutra.com/contact",
  mainEntity: {
    "@type": "Organization",
    name: "Kora Sutra",
    telephone: "+91-74166-44554",
    email: "customer.support@korasutra.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN"
    }
  }
};

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact Korasutra | Get in Touch - Customer Support</title>
        <meta 
          name="description" 
          content="Contact Kora Sutra for inquiries about handcrafted sarees. Reach us via phone +91 74166 44554, email customer.support@korasutra.com, or WhatsApp. We're here to help!" 
        />
        <meta name="keywords" content="contact Kora Sutra, Kora Sutra phone number, Kora Sutra email, customer support, saree inquiries" />
        <link rel="canonical" href="https://korasutra.com/contact" />
        
        <meta property="og:title" content="Contact Korasutra | Get in Touch" />
        <meta property="og:description" content="Contact us for inquiries about handcrafted sarees. Phone, email, or WhatsApp - we're here to help!" />
        <meta property="og:url" content="https://korasutra.com/contact" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-heading font-light mb-8">Contact Us</h1>
          <p className="text-muted-foreground font-body mb-12">
            We're here to help! Reach out to us with any questions, feedback, or concerns.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-heading mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-1">Phone</h3>
                    <a href="tel:+917416644554" className="text-muted-foreground font-body hover:text-foreground transition-colors">
                      +91 74166 44554
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-1">Email</h3>
                    <a href="mailto:customer.support@korasutra.com" className="text-muted-foreground font-body hover:text-foreground transition-colors">
                      customer.support@korasutra.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-1">Location</h3>
                    <p className="text-muted-foreground font-body">
                      Hyderabad, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-1">Business Hours</h3>
                    <p className="text-muted-foreground font-body">
                      Monday - Saturday: 10:00 AM - 6:00 PM IST
                    </p>
                    <p className="text-muted-foreground font-body">
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="mt-8">
                <a 
                  href={WHATSAPP_URL}
                  className="inline-flex items-center gap-3 px-6 py-4 bg-[#25D366] text-white font-body tracking-wide rounded-sm hover:bg-[#22c55e] transition-colors w-full justify-center"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-heading mb-6">Connect With Us</h2>
              
              <div className="space-y-6">
                <div className="p-6 bg-secondary/50 rounded-sm">
                  <h3 className="font-heading text-lg mb-2">Instagram</h3>
                  <p className="text-muted-foreground font-body mb-3">
                    Follow us for the latest collections and styling inspiration.
                  </p>
                  <a 
                    href="https://www.instagram.com/korasutraofficial/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline font-body"
                  >
                    @korasutraofficial
                  </a>
                </div>

                <div className="p-6 bg-secondary/50 rounded-sm">
                  <h3 className="font-heading text-lg mb-2">Facebook</h3>
                  <p className="text-muted-foreground font-body mb-3">
                    Join our community for updates and offers.
                  </p>
                  <a 
                    href="https://www.facebook.com/people/Korasutraofficial/61585129572992"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline font-body"
                  >
                    Korasutraofficial
                  </a>
                </div>

                <div className="p-6 bg-primary/10 rounded-sm">
                  <h3 className="font-heading text-lg mb-2">Shop Now</h3>
                  <p className="text-muted-foreground font-body mb-3">
                    Browse and purchase our collections right here on our website.
                  </p>
                  <a 
                    href="/collections/all"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-body text-sm rounded-sm hover:bg-primary/90 transition-colors"
                  >
                    Browse Collections
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
